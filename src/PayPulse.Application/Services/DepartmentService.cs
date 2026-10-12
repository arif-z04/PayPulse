using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IAppDbContext _context;

    public DepartmentService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        var departments = await _context.Departments
            .Include(d => d.HeadOfDepartment)
            .Include(d => d.Employees)
            .Where(d => d.IsActive)
            .OrderBy(d => d.DepartmentId)
            .ToListAsync(cancellationToken);

        return departments.Select(d => new DepartmentDto
        {
            Id = d.DepartmentId.ToString(),
            Code = d.DepartmentCode,
            Name = d.DepartmentName,
            Location = d.OfficeLocation,
            HeadOfDepartmentId = d.HeadOfDepartmentId?.ToString(),
            HeadOfDepartmentName = d.HeadOfDepartment?.FullName,
            EmployeeCount = d.Employees.Count(e => e.EmploymentStatus == "Active"),
            Description = d.Description,
            CreatedAt = d.CreatedAt.ToString("o")
        }).ToList();
    }

    public async Task<DepartmentDto> GetDepartmentByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var d = await _context.Departments
            .Include(d => d.HeadOfDepartment)
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.DepartmentId == id, cancellationToken);

        if (d == null)
            throw new NotFoundException("Department", id);

        return new DepartmentDto
        {
            Id = d.DepartmentId.ToString(),
            Code = d.DepartmentCode,
            Name = d.DepartmentName,
            Location = d.OfficeLocation,
            HeadOfDepartmentId = d.HeadOfDepartmentId?.ToString(),
            HeadOfDepartmentName = d.HeadOfDepartment?.FullName,
            EmployeeCount = d.Employees.Count(e => e.EmploymentStatus == "Active"),
            Description = d.Description,
            CreatedAt = d.CreatedAt.ToString("o")
        };
    }

    public async Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Code))
            throw new BusinessRuleException("Department name and code are required.");

        if (await _context.Departments.AnyAsync(d => d.DepartmentCode == dto.Code, cancellationToken))
            throw new DuplicateEntityException($"Department code '{dto.Code}' already exists.");

        if (await _context.Departments.AnyAsync(d => d.DepartmentName == dto.Name, cancellationToken))
            throw new DuplicateEntityException($"Department name '{dto.Name}' already exists.");

        int? headId = null;
        if (!string.IsNullOrWhiteSpace(dto.HeadOfDepartmentId) && int.TryParse(dto.HeadOfDepartmentId, out var hId))
        {
            if (await _context.Employees.AnyAsync(e => e.EmployeeId == hId, cancellationToken))
                headId = hId;
        }

        var dept = new Department
        {
            DepartmentName = dto.Name.Trim(),
            DepartmentCode = dto.Code.Trim().ToUpper(),
            OfficeLocation = dto.Location?.Trim() ?? "Headquarters",
            HeadOfDepartmentId = headId,
            Description = dto.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Departments.Add(dept);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetDepartmentByIdAsync(dept.DepartmentId, cancellationToken);
    }

    public async Task<DepartmentDto> UpdateDepartmentAsync(int id, UpdateDepartmentDto dto, CancellationToken cancellationToken = default)
    {
        var dept = await _context.Departments.FindAsync(new object[] { id }, cancellationToken);
        if (dept == null)
            throw new NotFoundException("Department", id);

        if (!string.IsNullOrWhiteSpace(dto.Name)) dept.DepartmentName = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Code)) dept.DepartmentCode = dto.Code.Trim().ToUpper();
        if (!string.IsNullOrWhiteSpace(dto.Location)) dept.OfficeLocation = dto.Location.Trim();
        if (dto.Description != null) dept.Description = dto.Description.Trim();
        if (dto.IsActive.HasValue) dept.IsActive = dto.IsActive.Value;

        if (!string.IsNullOrWhiteSpace(dto.HeadOfDepartmentId) && int.TryParse(dto.HeadOfDepartmentId, out var hId))
        {
            dept.HeadOfDepartmentId = hId > 0 ? hId : null;
        }
        else if (dto.HeadOfDepartmentId == null)
        {
            dept.HeadOfDepartmentId = null;
        }

        dept.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await GetDepartmentByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteDepartmentAsync(int id, CancellationToken cancellationToken = default)
    {
        var dept = await _context.Departments.FindAsync(new object[] { id }, cancellationToken);
        if (dept == null)
            throw new NotFoundException("Department", id);

        dept.IsActive = false;
        dept.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
