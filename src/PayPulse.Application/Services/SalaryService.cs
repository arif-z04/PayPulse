using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class SalaryService : ISalaryService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SalaryService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResponse<SalaryStructureDto>> GetSalariesAsync(PaginationParams pagination, CancellationToken cancellationToken = default)
    {
        var query = _context.SalaryStructures
            .Include(s => s.Employee)
            .Where(s => s.IsActive)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(pagination.Search))
        {
            var q = pagination.Search.Trim().ToLower();
            query = query.Where(s =>
                s.Employee.FirstName.ToLower().Contains(q) ||
                s.Employee.LastName.ToLower().Contains(q) ||
                s.Employee.EmployeeCode.ToLower().Contains(q));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = pagination.Page > 0 ? pagination.Page : 1;
        var pageSize = pagination.PageSize > 0 ? pagination.PageSize : 10;

        var items = await query
            .OrderBy(s => s.EmployeeId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedResponse<SalaryStructureDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<SalaryStructureDto> GetSalaryByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        var salary = await _context.SalaryStructures
            .Include(s => s.Employee)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.EmployeeId == employeeId && s.IsActive, cancellationToken);

        if (salary == null)
            throw new NotFoundException($"Active salary structure for employee {employeeId} not found.");

        return MapToDto(salary);
    }

    public async Task<SalaryStructureDto> UpdateSalaryStructureAsync(int employeeId, UpdateSalaryStructureDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _context.SalaryStructures
            .Include(s => s.Employee)
            .FirstOrDefaultAsync(s => s.EmployeeId == employeeId && s.IsActive, cancellationToken);

        if (existing == null)
            throw new NotFoundException($"Active salary structure for employee {employeeId} not found.");

        var oldState = JsonSerializer.Serialize(new
        {
            existing.BasicSalary,
            existing.HouseRentAllowance,
            existing.MedicalAllowance,
            existing.ConveyanceAllowance,
            existing.SpecialAllowance,
            existing.TaxDeductionRate,
            existing.ProvidentFundRate
        });

        var basic = dto.BasicSalary ?? existing.BasicSalary;
        if (basic <= 0)
            throw new BusinessRuleException("Basic salary must be greater than zero.");

        var houseRent = dto.HouseRentAllowance ?? existing.HouseRentAllowance;
        var medical = dto.MedicalAllowance ?? existing.MedicalAllowance;
        var conveyance = dto.ConveyanceAllowance ?? existing.ConveyanceAllowance;
        var special = dto.SpecialAllowance ?? existing.SpecialAllowance;
        var taxRate = dto.TaxDeductionRate ?? existing.TaxDeductionRate;
        var pfRate = dto.ProvidentFundRate ?? existing.ProvidentFundRate;

        if (taxRate < 0 || taxRate > 100 || pfRate < 0 || pfRate > 100)
            throw new BusinessRuleException("Tax and Provident Fund deduction rates must be between 0 and 100 percent.");

        existing.BasicSalary = basic;
        existing.HouseRentAllowance = houseRent;
        existing.MedicalAllowance = medical;
        existing.ConveyanceAllowance = conveyance;
        existing.SpecialAllowance = special;
        existing.TaxDeductionRate = taxRate;
        existing.ProvidentFundRate = pfRate;

        if (!string.IsNullOrWhiteSpace(dto.EffectiveDate) && DateOnly.TryParse(dto.EffectiveDate, out var effDate))
            existing.EffectiveFrom = effDate;

        if (!string.IsNullOrWhiteSpace(dto.RevisionNote))
            existing.RevisionNotes = dto.RevisionNote.Trim();

        existing.UpdatedAt = DateTime.UtcNow;

        _context.SystemAuditLogs.Add(new SystemAuditLog
        {
            TableName = "Salary_Structure",
            OperationType = "UPDATE",
            RecordId = existing.StructureId.ToString(),
            UserId = _currentUserService.UserId,
            IpAddress = _currentUserService.IpAddress,
            OldValues = oldState,
            NewValues = JsonSerializer.Serialize(new
            {
                existing.BasicSalary,
                existing.HouseRentAllowance,
                existing.MedicalAllowance,
                existing.ConveyanceAllowance,
                existing.SpecialAllowance,
                existing.TaxDeductionRate,
                existing.ProvidentFundRate
            }),
            Description = $"Updated salary structure for employee {existing.Employee.FullName} ({existing.Employee.EmployeeCode})",
            LoggedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(existing);
    }

    private static SalaryStructureDto MapToDto(SalaryStructure s)
    {
        return new SalaryStructureDto
        {
            Id = s.StructureId.ToString(),
            EmployeeId = s.EmployeeId.ToString(),
            EmployeeName = s.Employee?.FullName ?? $"Employee #{s.EmployeeId}",
            BasicSalary = s.BasicSalary,
            HouseRentAllowance = s.HouseRentAllowance,
            MedicalAllowance = s.MedicalAllowance,
            ConveyanceAllowance = s.ConveyanceAllowance,
            SpecialAllowance = s.SpecialAllowance,
            TaxDeductionRate = s.TaxDeductionRate,
            ProvidentFundRate = s.ProvidentFundRate,
            GrossSalary = s.GrossSalary,
            EstimatedNetSalary = s.EstimatedNetSalary,
            EffectiveDate = s.EffectiveFrom.ToString("yyyy-MM-dd"),
            Status = s.IsActive ? "Active" : "Archived",
            RevisionNote = s.RevisionNotes,
            CreatedAt = s.CreatedAt.ToString("o")
        };
    }
}
