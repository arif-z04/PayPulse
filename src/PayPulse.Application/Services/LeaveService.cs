using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PayPulse.Application.Common.Extensions;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class LeaveService : ILeaveService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public LeaveService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<LeaveTypeDto>> GetLeaveTypesAsync(CancellationToken cancellationToken = default)
    {
        var types = await _context.LeaveTypes
            .OrderBy(lt => lt.LeaveTypeId)
            .ToListAsync(cancellationToken);

        return types.Select(lt => new LeaveTypeDto
        {
            Id = lt.LeaveTypeId.ToString(),
            Code = lt.TypeName.Length >= 3 ? lt.TypeName[..3].ToUpper() : lt.TypeName.ToUpper(),
            Name = lt.TypeName,
            AnnualQuota = lt.AnnualQuota,
            IsPaid = lt.IsPaid,
            Description = lt.Description ?? string.Empty
        }).ToList();
    }

    public async Task<List<LeaveAllocationDto>> GetLeaveAllocationsAsync(int? employeeId = null, CancellationToken cancellationToken = default)
    {
        var targetEmpId = employeeId ?? _currentUserService.EmployeeId;
        var currentYear = DateTime.UtcNow.Year;

        var query = _context.LeaveAllocations
            .Include(a => a.Employee)
                .ThenInclude(e => e.Department)
            .Include(a => a.LeaveType)
            .Where(a => a.CalendarYear == currentYear)
            .AsNoTracking()
            .AsQueryable();

        if (targetEmpId.HasValue)
        {
            query = query.Where(a => a.EmployeeId == targetEmpId.Value);
        }

        var allocations = await query.ToListAsync(cancellationToken);

        // Calculate pending days for each allocation
        var pendingRequests = await _context.LeaveRequests
            .Where(r => r.ApplicationStatus == "Pending" && (targetEmpId == null || r.EmployeeId == targetEmpId.Value))
            .GroupBy(r => new { r.EmployeeId, r.LeaveTypeId })
            .Select(g => new { g.Key.EmployeeId, g.Key.LeaveTypeId, PendingDays = g.Sum(r => r.TotalDaysRequested) })
            .ToListAsync(cancellationToken);

        return allocations.Select(a =>
        {
            var pending = pendingRequests.FirstOrDefault(p => p.EmployeeId == a.EmployeeId && p.LeaveTypeId == a.LeaveTypeId)?.PendingDays ?? 0;
            return new LeaveAllocationDto
            {
                Id = a.AllocationId.ToString(),
                EmployeeId = a.EmployeeId.ToString(),
                EmployeeName = a.Employee?.FullName ?? $"Employee #{a.EmployeeId}",
                DepartmentName = a.Employee?.Department?.DepartmentName ?? "General",
                LeaveTypeId = a.LeaveTypeId.ToString(),
                LeaveTypeName = a.LeaveType.TypeName,
                Year = a.CalendarYear,
                TotalDays = a.TotalAllocatedDays,
                UsedDays = a.DaysUsed,
                PendingDays = pending,
                RemainingDays = a.DaysRemaining
            };
        }).ToList();
    }

    public async Task<PaginatedResponse<LeaveRequestDto>> GetLeaveRequestsAsync(LeaveRequestFilterParamsDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.LeaveRequests
            .Include(r => r.Employee)
                .ThenInclude(e => e.Department)
            .Include(r => r.LeaveType)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(r => r.ApplicationStatus == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.EmployeeId) && int.TryParse(filter.EmployeeId, out var empId))
        {
            query = query.Where(r => r.EmployeeId == empId);
        }

        if (!string.IsNullOrWhiteSpace(filter.DepartmentName))
        {
            query = query.Where(r => r.Employee.Department.DepartmentName == filter.DepartmentName);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(r =>
                r.Employee.FirstName.ToLower().Contains(q) ||
                r.Employee.LastName.ToLower().Contains(q) ||
                r.Reason.ToLower().Contains(q));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 10;

        var items = await query
            .OrderByDescending(r => r.AppliedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedResponse<LeaveRequestDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<LeaveRequestDto> SubmitLeaveRequestAsync(SubmitLeaveRequestDto dto, CancellationToken cancellationToken = default)
    {
        var empId = !string.IsNullOrWhiteSpace(dto.EmployeeId) && int.TryParse(dto.EmployeeId, out var parsedId)
            ? parsedId
            : _currentUserService.EmployeeId ?? throw new BusinessRuleException("Employee ID is required.");

        if (!int.TryParse(dto.LeaveTypeId, out var leaveTypeId) || !await _context.LeaveTypes.AnyAsync(lt => lt.LeaveTypeId == leaveTypeId, cancellationToken))
            throw new BusinessRuleException("Valid LeaveTypeId is required.");

        if (!DateOnly.TryParse(dto.StartDate, out var startDate) || !DateOnly.TryParse(dto.EndDate, out var endDate))
            throw new BusinessRuleException("Valid StartDate and EndDate are required.");

        if (endDate < startDate)
            throw new BusinessRuleException("End date cannot be prior to start date.");

        var days = dto.TotalDays > 0 ? dto.TotalDays : (endDate.DayNumber - startDate.DayNumber + 1);

        // Check allocation quota
        var currentYear = startDate.Year;
        var allocation = await _context.LeaveAllocations
            .FirstOrDefaultAsync(a => a.EmployeeId == empId && a.LeaveTypeId == leaveTypeId && a.CalendarYear == currentYear, cancellationToken);

        if (allocation != null && allocation.DaysRemaining < days)
        {
            throw new BusinessRuleException($"Insufficient leave balance. Requested {days} days, but only {allocation.DaysRemaining} days remain.");
        }

        // Check for overlapping leaves
        var hasOverlap = await _context.LeaveRequests
            .AnyAsync(r => r.EmployeeId == empId &&
                           (r.ApplicationStatus == "Approved" || r.ApplicationStatus == "Pending") &&
                           r.StartDate <= endDate && r.EndDate >= startDate,
                      cancellationToken);

        if (hasOverlap)
        {
            throw new BusinessRuleException("An overlapping leave application already exists for the specified dates.");
        }

        var request = new LeaveRequest
        {
            EmployeeId = empId,
            LeaveTypeId = leaveTypeId,
            StartDate = startDate,
            EndDate = endDate,
            TotalDaysRequested = days,
            Reason = dto.Reason?.Trim() ?? "Personal leave",
            ApplicationStatus = "Pending",
            AppliedDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LeaveRequests.Add(request);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetLeaveRequestByIdAsync(request.RequestId, cancellationToken);
    }

    public async Task<LeaveRequestDto> ApproveLeaveRequestAsync(int id, ApproveLeaveRequestDto dto, CancellationToken cancellationToken = default)
    {
        return await _context.ExecuteInTransactionAsync(async () =>
        {
            if (_context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
            {
                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    await connection.OpenAsync(cancellationToken);
                }
                using var cmd = connection.CreateCommand();
                cmd.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                cmd.CommandText = "SELECT Status FROM Leave_Request WHERE Request_ID = @id FOR UPDATE";
                var p = cmd.CreateParameter();
                p.ParameterName = "@id";
                p.Value = id;
                cmd.Parameters.Add(p);

                var statusObj = await cmd.ExecuteScalarAsync(cancellationToken);
                if (statusObj == null)
                    throw new NotFoundException("LeaveRequest", id);

                var lockedStatus = statusObj.ToString();
                if (lockedStatus != "Pending")
                    throw new BusinessRuleException($"Cannot approve leave request with status '{lockedStatus}'.");
            }

            var request = await _context.LeaveRequests
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .FirstOrDefaultAsync(r => r.RequestId == id, cancellationToken);

            if (request == null)
                throw new NotFoundException("LeaveRequest", id);

            if (request.ApplicationStatus != "Pending")
                throw new BusinessRuleException($"Cannot approve leave request with status '{request.ApplicationStatus}'.");

            var currentYear = request.StartDate.Year;
            var allocation = await _context.LeaveAllocations
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId &&
                                          a.LeaveTypeId == request.LeaveTypeId &&
                                          a.CalendarYear == currentYear, cancellationToken);

            if (allocation != null && allocation.DaysRemaining < request.TotalDaysRequested)
            {
                throw new BusinessRuleException($"Quota exceeded. Remaining days: {allocation.DaysRemaining}, Requested: {request.TotalDaysRequested}");
            }

            request.ApplicationStatus = "Approved";
            request.ApprovedByUserId = _currentUserService.UserId;
            request.ApprovalDate = DateTime.UtcNow;
            request.SupervisorComments = dto.Comment?.Trim() ?? "Approved";
            request.UpdatedAt = DateTime.UtcNow;

            // In-memory provider synchronization (MySQL uses trg_SyncLeaveAllocationOnStatusChange trigger)
            if (_context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory" && allocation != null)
            {
                allocation.DaysUsed += request.TotalDaysRequested;
                allocation.DaysRemaining -= request.TotalDaysRequested;
                allocation.UpdatedAt = DateTime.UtcNow;
            }

            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                TableName = "Leave_Request",
                OperationType = "UPDATE",
                RecordId = request.RequestId.ToString(),
                UserId = _currentUserService.UserId,
                IpAddress = _currentUserService.IpAddress,
                OldValues = JsonSerializer.Serialize(new { status = "Pending" }),
                NewValues = JsonSerializer.Serialize(new { status = "Approved", comments = request.SupervisorComments }),
                Description = $"Approved {request.LeaveType.TypeName} leave ({request.TotalDaysRequested} days) for {request.Employee.FullName}",
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(request);
        }, cancellationToken);
    }

    public async Task<LeaveRequestDto> RejectLeaveRequestAsync(int id, RejectLeaveRequestDto dto, CancellationToken cancellationToken = default)
    {
        return await _context.ExecuteInTransactionAsync(async () =>
        {
            if (_context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
            {
                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    await connection.OpenAsync(cancellationToken);
                }
                using var cmd = connection.CreateCommand();
                cmd.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                cmd.CommandText = "SELECT Status FROM Leave_Request WHERE Request_ID = @id FOR UPDATE";
                var p = cmd.CreateParameter();
                p.ParameterName = "@id";
                p.Value = id;
                cmd.Parameters.Add(p);

                var statusObj = await cmd.ExecuteScalarAsync(cancellationToken);
                if (statusObj == null)
                    throw new NotFoundException("LeaveRequest", id);

                var lockedStatus = statusObj.ToString();
                if (lockedStatus != "Pending")
                    throw new BusinessRuleException($"Cannot reject leave request with status '{lockedStatus}'.");
            }

            var request = await _context.LeaveRequests
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .FirstOrDefaultAsync(r => r.RequestId == id, cancellationToken);

            if (request == null)
                throw new NotFoundException("LeaveRequest", id);

            if (request.ApplicationStatus != "Pending")
                throw new BusinessRuleException($"Cannot reject leave request with status '{request.ApplicationStatus}'.");

            request.ApplicationStatus = "Rejected";
            request.ApprovedByUserId = _currentUserService.UserId;
            request.ApprovalDate = DateTime.UtcNow;
            request.SupervisorComments = dto.Comment?.Trim() ?? "Rejected";
            request.UpdatedAt = DateTime.UtcNow;

            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                TableName = "Leave_Request",
                OperationType = "UPDATE",
                RecordId = request.RequestId.ToString(),
                UserId = _currentUserService.UserId,
                IpAddress = _currentUserService.IpAddress,
                OldValues = JsonSerializer.Serialize(new { status = "Pending" }),
                NewValues = JsonSerializer.Serialize(new { status = "Rejected", comments = request.SupervisorComments }),
                Description = $"Rejected {request.LeaveType.TypeName} leave for {request.Employee.FullName}: {dto.Comment}",
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(request);
        }, cancellationToken);
    }

    public async Task<LeaveRequestDto> CancelLeaveRequestAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ExecuteInTransactionAsync(async () =>
        {
            var request = await _context.LeaveRequests
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .FirstOrDefaultAsync(r => r.RequestId == id, cancellationToken);

            if (request == null)
                throw new NotFoundException("LeaveRequest", id);

            if (request.ApplicationStatus == "Cancelled" || request.ApplicationStatus == "Rejected")
                throw new BusinessRuleException($"Leave request is already {request.ApplicationStatus}.");

            var wasApproved = request.ApplicationStatus == "Approved";

            request.ApplicationStatus = "Cancelled";
            request.UpdatedAt = DateTime.UtcNow;

            if (wasApproved)
            {
                var currentYear = request.StartDate.Year;
                var allocation = await _context.LeaveAllocations
                    .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId &&
                                              a.LeaveTypeId == request.LeaveTypeId &&
                                              a.CalendarYear == currentYear, cancellationToken);

                if (_context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory" && allocation != null)
                {
                    allocation.DaysUsed = Math.Max(0, allocation.DaysUsed - request.TotalDaysRequested);
                    allocation.DaysRemaining = Math.Min(allocation.TotalAllocatedDays, allocation.DaysRemaining + request.TotalDaysRequested);
                    allocation.UpdatedAt = DateTime.UtcNow;
                }
            }

            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                TableName = "Leave_Request",
                OperationType = "UPDATE",
                RecordId = request.RequestId.ToString(),
                UserId = _currentUserService.UserId,
                IpAddress = _currentUserService.IpAddress,
                OldValues = JsonSerializer.Serialize(new { status = wasApproved ? "Approved" : "Pending" }),
                NewValues = JsonSerializer.Serialize(new { status = "Cancelled" }),
                Description = $"Cancelled {request.LeaveType.TypeName} leave for {request.Employee.FullName}",
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(request);
        }, cancellationToken);
    }

    private async Task<LeaveRequestDto> GetLeaveRequestByIdAsync(int id, CancellationToken cancellationToken)
    {
        var r = await _context.LeaveRequests
            .Include(r => r.Employee)
                .ThenInclude(e => e.Department)
            .Include(r => r.LeaveType)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RequestId == id, cancellationToken);

        if (r == null) throw new NotFoundException("LeaveRequest", id);
        return MapToDto(r);
    }

    private static LeaveRequestDto MapToDto(LeaveRequest r)
    {
        return new LeaveRequestDto
        {
            Id = r.RequestId.ToString(),
            EmployeeId = r.EmployeeId.ToString(),
            EmployeeName = r.Employee?.FullName ?? $"Employee #{r.EmployeeId}",
            DepartmentName = r.Employee?.Department?.DepartmentName ?? "General",
            LeaveTypeId = r.LeaveTypeId.ToString(),
            LeaveTypeName = r.LeaveType?.TypeName ?? "Leave",
            StartDate = r.StartDate.ToString("yyyy-MM-dd"),
            EndDate = r.EndDate.ToString("yyyy-MM-dd"),
            TotalDays = r.TotalDaysRequested,
            Reason = r.Reason,
            Status = r.ApplicationStatus,
            AppliedDate = r.AppliedDate.ToString("o"),
            ApprovedBySupervisorDate = r.ApprovalDate?.ToString("o"),
            ApprovedByHrDate = r.ApprovalDate?.ToString("o"),
            SupervisorComment = r.SupervisorComments,
            HrComment = r.SupervisorComments
        };
    }
}
