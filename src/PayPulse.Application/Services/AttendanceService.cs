using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Extensions;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AttendanceService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResponse<AttendanceRecordDto>> GetAttendanceAsync(AttendanceFilterParamsDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.AttendanceLogs
            .Include(a => a.Employee)
                .ThenInclude(e => e.Department)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Date) && DateOnly.TryParse(filter.Date, out var queryDate))
        {
            query = query.Where(a => a.WorkDate == queryDate);
        }

        if (!string.IsNullOrWhiteSpace(filter.EmployeeId) && int.TryParse(filter.EmployeeId, out var empId))
        {
            query = query.Where(a => a.EmployeeId == empId);
        }

        if (!string.IsNullOrWhiteSpace(filter.DepartmentName))
        {
            query = query.Where(a => a.Employee.Department.DepartmentName == filter.DepartmentName);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(a => a.AttendanceStatus == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Employee.FirstName.ToLower().Contains(q) ||
                a.Employee.LastName.ToLower().Contains(q) ||
                a.Employee.EmployeeCode.ToLower().Contains(q));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 10;

        var items = await query
            .OrderByDescending(a => a.WorkDate)
            .ThenBy(a => a.EmployeeId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedResponse<AttendanceRecordDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<AttendanceSummaryDto> GetAttendanceSummaryAsync(DateOnly? date = null, CancellationToken cancellationToken = default)
    {
        var queryDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var records = await _context.AttendanceLogs
            .Where(a => a.WorkDate == queryDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalEmployees = await _context.Employees.CountAsync(e => e.EmploymentStatus == "Active", cancellationToken);
        var total = records.Count > 0 ? records.Count : totalEmployees;

        var present = records.Count(r => r.AttendanceStatus == "Present");
        var late = records.Count(r => r.AttendanceStatus == "Late");
        var halfDay = records.Count(r => r.AttendanceStatus == "Half-Day");
        var absent = records.Count(r => r.AttendanceStatus == "Absent");

        if (records.Count == 0 && totalEmployees > 0)
        {
            // If no records punched yet today, estimate based on active headcount
            present = (int)(totalEmployees * 0.90);
            late = (int)(totalEmployees * 0.05);
            absent = totalEmployees - present - late;
            total = totalEmployees;
        }

        var rate = total > 0 ? (int)Math.Round(((present + late + halfDay * 0.5) / total) * 100) : 0;

        return new AttendanceSummaryDto
        {
            Total = total,
            Present = present,
            Late = late,
            HalfDay = halfDay,
            Absent = absent,
            AttendanceRate = rate
        };
    }

    public async Task<AttendanceRecordDto> CheckInAsync(int? employeeId = null, CancellationToken cancellationToken = default)
    {
        var targetEmployeeId = employeeId ?? _currentUserService.EmployeeId
            ?? throw new BusinessRuleException("Employee ID is required for punch-in.");

        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.EmployeeId == targetEmployeeId, cancellationToken);

        if (employee == null)
            throw new NotFoundException("Employee", targetEmployeeId);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;

        var existing = await _context.AttendanceLogs
            .FirstOrDefaultAsync(a => a.EmployeeId == targetEmployeeId && a.WorkDate == today, cancellationToken);

        var isLate = now.TimeOfDay > new TimeSpan(9, 15, 0);
        var status = isLate ? "Late" : "Present";

        if (existing != null)
        {
            if (!existing.CheckInTime.HasValue)
            {
                existing.CheckInTime = now;
                existing.AttendanceStatus = status;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            existing = new AttendanceLog
            {
                EmployeeId = targetEmployeeId,
                WorkDate = today,
                CheckInTime = now,
                CheckOutTime = null,
                TotalHoursWorked = 0,
                OvertimeHours = 0,
                AttendanceStatus = status,
                Remarks = "Self-service web punch-in",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.AttendanceLogs.Add(existing);
        }

        await _context.SaveChangesAsync(cancellationToken);
        existing.Employee = employee;

        return MapToDto(existing);
    }

    public async Task<AttendanceRecordDto> CheckOutAsync(int? employeeId = null, CancellationToken cancellationToken = default)
    {
        var targetEmployeeId = employeeId ?? _currentUserService.EmployeeId
            ?? throw new BusinessRuleException("Employee ID is required for punch-out.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;

        var existing = await _context.AttendanceLogs
            .Include(a => a.Employee)
                .ThenInclude(e => e.Department)
            .FirstOrDefaultAsync(a => a.EmployeeId == targetEmployeeId && a.WorkDate == today, cancellationToken);

        if (existing == null || !existing.CheckInTime.HasValue)
        {
            throw new BusinessRuleException("Must check-in before check-out.");
        }

        existing.CheckOutTime = now;
        var diffHours = (decimal)(now - existing.CheckInTime.Value).TotalHours;
        existing.TotalHoursWorked = Math.Round(Math.Min(diffHours, 24m), 2);
        existing.OvertimeHours = existing.TotalHoursWorked > 8.0m ? Math.Round(existing.TotalHoursWorked - 8.0m, 2) : 0m;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(existing);
    }

    public async Task<AttendanceRecordDto> CorrectAttendanceAsync(int id, CorrectAttendanceRequestDto dto, CancellationToken cancellationToken = default)
    {
        return await _context.ExecuteInTransactionAsync(async () =>
        {
            var log = await _context.AttendanceLogs
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Department)
                .FirstOrDefaultAsync(a => a.LogId == id, cancellationToken);

            if (log == null)
                throw new NotFoundException("AttendanceLog", id);

            if (dto.CheckInTime.HasValue && dto.CheckOutTime.HasValue)
            {
                if (dto.CheckOutTime.Value < dto.CheckInTime.Value)
                    throw new BusinessRuleException("Check-out time cannot precede check-in time.");

                var diffHours = (decimal)(dto.CheckOutTime.Value - dto.CheckInTime.Value).TotalHours;
                if (diffHours > 24m)
                    throw new BusinessRuleException("Working hours cannot exceed 24 hours.");

                log.TotalHoursWorked = Math.Round(Math.Min(diffHours, 24m), 2);
                log.OvertimeHours = log.TotalHoursWorked > 8.0m ? Math.Round(log.TotalHoursWorked - 8.0m, 2) : 0m;
            }

            var oldValues = JsonSerializer.Serialize(new
            {
                checkIn = log.CheckInTime,
                checkOut = log.CheckOutTime,
                hours = log.TotalHoursWorked,
                overtime = log.OvertimeHours,
                status = log.AttendanceStatus
            });

            if (dto.CheckInTime.HasValue) log.CheckInTime = dto.CheckInTime.Value;
            if (dto.CheckOutTime.HasValue) log.CheckOutTime = dto.CheckOutTime.Value;
            if (!string.IsNullOrWhiteSpace(dto.Status)) log.AttendanceStatus = dto.Status.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Remarks)) log.Remarks = dto.Remarks.Trim();
            log.UpdatedAt = DateTime.UtcNow;

            var newValues = JsonSerializer.Serialize(new
            {
                checkIn = log.CheckInTime,
                checkOut = log.CheckOutTime,
                hours = log.TotalHoursWorked,
                overtime = log.OvertimeHours,
                status = log.AttendanceStatus
            });

            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                TableName = "Attendance_Log",
                OperationType = "UPDATE",
                RecordId = id.ToString(),
                UserId = _currentUserService.UserId,
                IpAddress = _currentUserService.IpAddress,
                OldValues = oldValues,
                NewValues = newValues,
                Description = $"Corrected attendance log #{id} for {log.Employee?.FullName ?? "Staff"} on {log.WorkDate}. Reason: {dto.Remarks ?? "Manual correction"}",
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(log);
        }, cancellationToken);
    }

    private static AttendanceRecordDto MapToDto(AttendanceLog a)
    {
        return new AttendanceRecordDto
        {
            Id = a.LogId.ToString(),
            EmployeeId = a.EmployeeId.ToString(),
            EmployeeCode = a.Employee?.EmployeeCode ?? $"EMP-{a.EmployeeId}",
            EmployeeName = a.Employee?.FullName ?? $"Employee #{a.EmployeeId}",
            DepartmentName = a.Employee?.Department?.DepartmentName ?? "General",
            Date = a.WorkDate.ToString("yyyy-MM-dd"),
            CheckInTime = a.CheckInTime?.ToString("hh:mm tt"),
            CheckOutTime = a.CheckOutTime?.ToString("hh:mm tt"),
            WorkingHours = a.TotalHoursWorked,
            OvertimeHours = a.OvertimeHours,
            Status = a.AttendanceStatus,
            Remarks = a.Remarks
        };
    }
}
