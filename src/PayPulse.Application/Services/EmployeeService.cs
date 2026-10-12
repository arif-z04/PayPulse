using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Extensions;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;

    public EmployeeService(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
    }

    public async Task<PaginatedResponse<EmployeeDto>> GetEmployeesAsync(EmployeeFilterParamsDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.Manager)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(e =>
                e.FirstName.ToLower().Contains(search) ||
                e.LastName.ToLower().Contains(search) ||
                e.EmployeeCode.ToLower().Contains(search) ||
                e.OfficialEmail.ToLower().Contains(search) ||
                e.Department.DepartmentName.ToLower().Contains(search) ||
                e.Designation.DesignationTitle.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(filter.DepartmentId) && int.TryParse(filter.DepartmentId, out var deptId))
        {
            query = query.Where(e => e.DepartmentId == deptId);
        }

        if (!string.IsNullOrWhiteSpace(filter.DesignationId) && int.TryParse(filter.DesignationId, out var desigId))
        {
            query = query.Where(e => e.DesignationId == desigId);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(e => e.EmploymentStatus == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.EmploymentType))
        {
            query = query.Where(e => e.EmploymentType == filter.EmploymentType);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "employeecode" => filter.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(e => e.EmployeeCode) : query.OrderBy(e => e.EmployeeCode),
            "fullname" => filter.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(e => e.FirstName).ThenByDescending(e => e.LastName) : query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName),
            "departmentname" => filter.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(e => e.Department.DepartmentName) : query.OrderBy(e => e.Department.DepartmentName),
            "designationtitle" => filter.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(e => e.Designation.DesignationTitle) : query.OrderBy(e => e.Designation.DesignationTitle),
            "dateofjoining" => filter.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(e => e.DateOfJoining) : query.OrderBy(e => e.DateOfJoining),
            _ => query.OrderBy(e => e.EmployeeId)
        };

        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 10;

        var employees = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = employees.Select(MapToDto).ToList();

        return new PaginatedResponse<EmployeeDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<EmployeeDto> GetEmployeeByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.Manager)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.EmployeeId == id, cancellationToken);

        if (employee == null)
            throw new NotFoundException("Employee", id);

        return MapToDto(employee);
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
            throw new BusinessRuleException("First name and last name are required.");

        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new BusinessRuleException("Official email is required.");

        if (string.IsNullOrWhiteSpace(dto.Nid))
            throw new BusinessRuleException("NID number is required.");

        if (!int.TryParse(dto.DepartmentId, out var deptId) || !await _context.Departments.AnyAsync(d => d.DepartmentId == deptId, cancellationToken))
            throw new BusinessRuleException("Invalid department specified.");

        if (!int.TryParse(dto.DesignationId, out var desigId) || !await _context.Designations.AnyAsync(d => d.DesignationId == desigId, cancellationToken))
            throw new BusinessRuleException("Invalid designation specified.");

        int? managerId = null;
        if (!string.IsNullOrWhiteSpace(dto.SupervisorId) && int.TryParse(dto.SupervisorId, out var mId))
        {
            if (await _context.Employees.AnyAsync(e => e.EmployeeId == mId, cancellationToken))
                managerId = mId;
        }

        // Check duplicates
        if (await _context.Employees.AnyAsync(e => e.OfficialEmail == dto.Email, cancellationToken))
            throw new DuplicateEntityException($"Employee with email '{dto.Email}' already exists.");

        if (await _context.Employees.AnyAsync(e => e.NidNumber == dto.Nid, cancellationToken))
            throw new DuplicateEntityException($"Employee with NID '{dto.Nid}' already exists.");

        // Generate employee code if not provided
        var empCode = dto.EmployeeCode;
        if (string.IsNullOrWhiteSpace(empCode))
        {
            var maxId = (await _context.Employees.MaxAsync(e => (int?)e.EmployeeId, cancellationToken)) ?? 1000;
            empCode = $"EMP-{maxId + 1}";
        }

        var username = dto.Email.Split('@')[0].ToLower();
        if (await _context.Users.AnyAsync(u => u.Username == username, cancellationToken))
        {
            username = $"{username}.{new Random().Next(10, 99)}";
        }

        try
        {
            return await _context.ExecuteInTransactionAsync(async () =>
            {
                // Provision user account
                var user = new UserAccount
                {
                    Username = username,
                    PasswordHash = _passwordHasher.HashPassword("Password@123"),
                    Role = "Employee",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync(cancellationToken);

                var dateOfBirth = DateOnly.TryParse(dto.DateOfBirth, out var dob) ? dob : new DateOnly(1995, 1, 1);
                var dateOfJoining = DateOnly.TryParse(dto.DateOfJoining, out var doj) ? doj : DateOnly.FromDateTime(DateTime.UtcNow);

                var employee = new Employee
                {
                    UserId = user.UserId,
                    EmployeeCode = empCode,
                    FirstName = dto.FirstName.Trim(),
                    LastName = dto.LastName.Trim(),
                    OfficialEmail = dto.Email.Trim().ToLower(),
                    PhoneNumber = dto.Phone?.Trim() ?? string.Empty,
                    NidNumber = dto.Nid.Trim(),
                    DateOfBirth = dateOfBirth,
                    Gender = dto.Gender ?? "Male",
                    ResidentialAddress = dto.Address?.Trim() ?? string.Empty,
                    DepartmentId = deptId,
                    DesignationId = desigId,
                    ManagerId = managerId,
                    DateOfJoining = dateOfJoining,
                    EmploymentType = dto.EmploymentType ?? "Full-Time",
                    EmploymentStatus = dto.Status ?? "Active",
                    BankName = dto.BankDetails?.BankName ?? "Eastern Bank PLC",
                    BankBranch = dto.BankDetails?.BranchName ?? "Principal Branch",
                    BankAccountNumber = dto.BankDetails?.AccountNumber ?? "100200300400",
                    RoutingNumber = dto.BankDetails?.RoutingNumber ?? "095261399",
                    EmergencyContactName = dto.EmergencyContact?.Name ?? string.Empty,
                    EmergencyContactRelation = dto.EmergencyContact?.Relation ?? string.Empty,
                    EmergencyContactPhone = dto.EmergencyContact?.Phone ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync(cancellationToken);

                // Create default salary structure
                var basicSalary = dto.InitialBasicSalary ?? 60000m;
                var salary = new SalaryStructure
                {
                    EmployeeId = employee.EmployeeId,
                    BasicSalary = basicSalary,
                    HouseRentAllowance = Math.Round(basicSalary * 0.20m, 2),
                    MedicalAllowance = Math.Round(basicSalary * 0.10m, 2),
                    ConveyanceAllowance = 5000m,
                    SpecialAllowance = 0m,
                    TaxDeductionRate = 5.0m,
                    ProvidentFundRate = 7.0m,
                    EffectiveFrom = dateOfJoining,
                    IsActive = true,
                    RevisionNotes = "Initial onboarding compensation package.",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SalaryStructures.Add(salary);

                // Allocate leave quotas for the current calendar year
                var currentYear = DateTime.UtcNow.Year;
                var leaveTypes = await _context.LeaveTypes.Where(lt => lt.IsActive).ToListAsync(cancellationToken);
                foreach (var lt in leaveTypes)
                {
                    _context.LeaveAllocations.Add(new LeaveAllocation
                    {
                        EmployeeId = employee.EmployeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        CalendarYear = currentYear,
                        TotalAllocatedDays = lt.AnnualQuota,
                        DaysUsed = 0,
                        DaysRemaining = lt.AnnualQuota,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }

                // Audit log
                _context.SystemAuditLogs.Add(new SystemAuditLog
                {
                    TableName = "Employee",
                    OperationType = "INSERT",
                    RecordId = employee.EmployeeId.ToString(),
                    UserId = _currentUserService.UserId,
                    IpAddress = _currentUserService.IpAddress,
                    OldValues = null,
                    NewValues = JsonSerializer.Serialize(new { employee.EmployeeCode, employee.OfficialEmail, employee.DepartmentId }),
                    Description = $"Onboarded employee {employee.FullName} ({employee.EmployeeCode})",
                    LoggedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync(cancellationToken);

                return await GetEmployeeByIdAsync(employee.EmployeeId, cancellationToken);
            }, cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException != null && (ex.InnerException.Message.Contains("Duplicate") || ex.InnerException.Message.Contains("1062")))
            {
                throw new DuplicateEntityException("An employee or user with these unique attributes (Email, NID, Username, or Code) already exists.");
            }
            throw;
        }
    }

    public async Task<EmployeeDto> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, cancellationToken);
        if (employee == null)
            throw new NotFoundException("Employee", id);

        var oldState = JsonSerializer.Serialize(new
        {
            employee.FirstName,
            employee.LastName,
            employee.DepartmentId,
            employee.DesignationId,
            employee.EmploymentStatus
        });

        if (!string.IsNullOrWhiteSpace(dto.FirstName)) employee.FirstName = dto.FirstName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.LastName)) employee.LastName = dto.LastName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Phone)) employee.PhoneNumber = dto.Phone.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Address)) employee.ResidentialAddress = dto.Address.Trim();

        if (int.TryParse(dto.DepartmentId, out var deptId) && deptId > 0)
            employee.DepartmentId = deptId;

        if (int.TryParse(dto.DesignationId, out var desigId) && desigId > 0)
            employee.DesignationId = desigId;

        if (!string.IsNullOrWhiteSpace(dto.SupervisorId) && int.TryParse(dto.SupervisorId, out var supId))
            employee.ManagerId = supId > 0 ? supId : null;
        else if (dto.SupervisorId == null)
            employee.ManagerId = null;

        if (!string.IsNullOrWhiteSpace(dto.EmploymentType)) employee.EmploymentType = dto.EmploymentType;
        if (!string.IsNullOrWhiteSpace(dto.Status)) employee.EmploymentStatus = dto.Status;

        if (dto.BankDetails != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.BankDetails.BankName)) employee.BankName = dto.BankDetails.BankName;
            if (!string.IsNullOrWhiteSpace(dto.BankDetails.BranchName)) employee.BankBranch = dto.BankDetails.BranchName;
            if (!string.IsNullOrWhiteSpace(dto.BankDetails.AccountNumber)) employee.BankAccountNumber = dto.BankDetails.AccountNumber;
            if (!string.IsNullOrWhiteSpace(dto.BankDetails.RoutingNumber)) employee.RoutingNumber = dto.BankDetails.RoutingNumber;
        }

        if (dto.EmergencyContact != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.EmergencyContact.Name)) employee.EmergencyContactName = dto.EmergencyContact.Name;
            if (!string.IsNullOrWhiteSpace(dto.EmergencyContact.Relation)) employee.EmergencyContactRelation = dto.EmergencyContact.Relation;
            if (!string.IsNullOrWhiteSpace(dto.EmergencyContact.Phone)) employee.EmergencyContactPhone = dto.EmergencyContact.Phone;
        }

        employee.UpdatedAt = DateTime.UtcNow;

        _context.SystemAuditLogs.Add(new SystemAuditLog
        {
            TableName = "Employee",
            OperationType = "UPDATE",
            RecordId = employee.EmployeeId.ToString(),
            UserId = _currentUserService.UserId,
            IpAddress = _currentUserService.IpAddress,
            OldValues = oldState,
            NewValues = JsonSerializer.Serialize(new
            {
                employee.FirstName,
                employee.LastName,
                employee.DepartmentId,
                employee.DesignationId,
                employee.EmploymentStatus
            }),
            Description = $"Updated profile of employee {employee.FullName} ({employee.EmployeeCode})",
            LoggedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return await GetEmployeeByIdAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteEmployeeAsync(int id, CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees
            .Include(e => e.UserAccount)
            .FirstOrDefaultAsync(e => e.EmployeeId == id, cancellationToken);

        if (employee == null)
            throw new NotFoundException("Employee", id);

        employee.EmploymentStatus = "Terminated";
        employee.UpdatedAt = DateTime.UtcNow;

        if (employee.UserAccount != null)
        {
            employee.UserAccount.IsActive = false;
            employee.UserAccount.UpdatedAt = DateTime.UtcNow;
        }

        _context.SystemAuditLogs.Add(new SystemAuditLog
        {
            TableName = "Employee",
            OperationType = "UPDATE",
            RecordId = employee.EmployeeId.ToString(),
            UserId = _currentUserService.UserId,
            IpAddress = _currentUserService.IpAddress,
            Description = $"Deactivated/Terminated employee {employee.FullName} ({employee.EmployeeCode})",
            LoggedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static EmployeeDto MapToDto(Employee e)
    {
        return new EmployeeDto
        {
            Id = e.EmployeeId.ToString(),
            EmployeeCode = e.EmployeeCode,
            FirstName = e.FirstName,
            LastName = e.LastName,
            FullName = e.FullName,
            Email = e.OfficialEmail,
            Phone = e.PhoneNumber,
            Nid = e.NidNumber,
            DateOfBirth = e.DateOfBirth.ToString("yyyy-MM-dd"),
            Gender = e.Gender,
            Address = e.ResidentialAddress,
            DepartmentId = e.DepartmentId.ToString(),
            DepartmentName = e.Department?.DepartmentName ?? string.Empty,
            DesignationId = e.DesignationId.ToString(),
            DesignationTitle = e.Designation?.DesignationTitle ?? string.Empty,
            SupervisorId = e.ManagerId?.ToString(),
            SupervisorName = e.Manager?.FullName,
            DateOfJoining = e.DateOfJoining.ToString("yyyy-MM-dd"),
            EmploymentType = e.EmploymentType,
            Status = e.EmploymentStatus,
            BankDetails = new BankDetailsDto
            {
                BankName = e.BankName,
                BranchName = e.BankBranch,
                AccountNumber = MaskAccountNumber(e.BankAccountNumber),
                RoutingNumber = e.RoutingNumber
            },
            EmergencyContact = new EmergencyContactDto
            {
                Name = e.EmergencyContactName,
                Relation = e.EmergencyContactRelation,
                Phone = e.EmergencyContactPhone
            },
            AvatarUrl = e.ProfilePictureUrl,
            CreatedAt = e.CreatedAt.ToString("o"),
            UpdatedAt = e.UpdatedAt.ToString("o")
        };
    }

    private static string MaskAccountNumber(string account)
    {
        if (string.IsNullOrWhiteSpace(account) || account.Length <= 4)
            return "****";
        return new string('*', account.Length - 4) + account[^4..];
    }
}
