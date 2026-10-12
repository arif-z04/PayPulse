using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class DesignationService : IDesignationService
{
    private readonly IAppDbContext _context;

    public DesignationService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DesignationDto>> GetDesignationsAsync(int? departmentId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Designations
            .Include(d => d.Department)
            .Include(d => d.Employees)
            .Where(d => d.IsActive)
            .AsNoTracking();

        if (departmentId.HasValue)
        {
            query = query.Where(d => d.DepartmentId == departmentId.Value);
        }

        var list = await query.OrderBy(d => d.DesignationId).ToListAsync(cancellationToken);

        return list.Select(d => new DesignationDto
        {
            Id = d.DesignationId.ToString(),
            Title = d.DesignationTitle,
            DepartmentId = d.DepartmentId.ToString(),
            DepartmentName = d.Department.DepartmentName,
            MinSalary = d.MinSalary,
            MaxSalary = d.MaxSalary,
            EmployeeCount = d.Employees.Count(e => e.EmploymentStatus == "Active"),
            Description = d.Description
        }).ToList();
    }

    public async Task<DesignationDto> GetDesignationByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var d = await _context.Designations
            .Include(d => d.Department)
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.DesignationId == id, cancellationToken);

        if (d == null)
            throw new NotFoundException("Designation", id);

        return new DesignationDto
        {
            Id = d.DesignationId.ToString(),
            Title = d.DesignationTitle,
            DepartmentId = d.DepartmentId.ToString(),
            DepartmentName = d.Department.DepartmentName,
            MinSalary = d.MinSalary,
            MaxSalary = d.MaxSalary,
            EmployeeCount = d.Employees.Count(e => e.EmploymentStatus == "Active"),
            Description = d.Description
        };
    }

    public async Task<DesignationDto> CreateDesignationAsync(CreateDesignationDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new BusinessRuleException("Designation title is required.");

        if (!int.TryParse(dto.DepartmentId, out var deptId) || !await _context.Departments.AnyAsync(d => d.DepartmentId == deptId, cancellationToken))
            throw new BusinessRuleException("Valid DepartmentId is required.");

        if (dto.MinSalary < 0 || dto.MaxSalary < dto.MinSalary)
            throw new BusinessRuleException("Maximum salary must be greater than or equal to minimum salary and non-negative.");

        var desig = new Designation
        {
            DepartmentId = deptId,
            DesignationTitle = dto.Title.Trim(),
            MinSalary = dto.MinSalary,
            MaxSalary = dto.MaxSalary,
            Description = dto.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Designations.Add(desig);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetDesignationByIdAsync(desig.DesignationId, cancellationToken);
    }

    public async Task<DesignationDto> UpdateDesignationAsync(int id, UpdateDesignationDto dto, CancellationToken cancellationToken = default)
    {
        var desig = await _context.Designations.FindAsync(new object[] { id }, cancellationToken);
        if (desig == null)
            throw new NotFoundException("Designation", id);

        if (!string.IsNullOrWhiteSpace(dto.Title)) desig.DesignationTitle = dto.Title.Trim();
        if (dto.MinSalary.HasValue) desig.MinSalary = dto.MinSalary.Value;
        if (dto.MaxSalary.HasValue) desig.MaxSalary = dto.MaxSalary.Value;

        if (desig.MaxSalary < desig.MinSalary)
            throw new BusinessRuleException("Maximum salary cannot be less than minimum salary.");

        if (dto.Description != null) desig.Description = dto.Description.Trim();
        if (dto.IsActive.HasValue) desig.IsActive = dto.IsActive.Value;

        desig.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await GetDesignationByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteDesignationAsync(int id, CancellationToken cancellationToken = default)
    {
        var desig = await _context.Designations.FindAsync(new object[] { id }, cancellationToken);
        if (desig == null)
            throw new NotFoundException("Designation", id);

        desig.IsActive = false;
        desig.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
