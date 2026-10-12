using PayPulse.Application.Common.Models;

namespace PayPulse.Application.DTOs;

public class BankDetailsDto
{
    public string BankName { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string RoutingNumber { get; set; } = string.Empty;
}

public class EmergencyContactDto
{
    public string Name { get; set; } = string.Empty;
    public string Relation { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class EmployeeDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Nid { get; set; } = string.Empty;
    public string DateOfBirth { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DesignationId { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string? SupervisorId { get; set; }
    public string? SupervisorName { get; set; }
    public string DateOfJoining { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public BankDetailsDto BankDetails { get; set; } = new();
    public EmergencyContactDto EmergencyContact { get; set; } = new();
    public string? AvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class CreateEmployeeDto
{
    public string? EmployeeCode { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Nid { get; set; } = string.Empty;
    public string DateOfBirth { get; set; } = string.Empty;
    public string Gender { get; set; } = "Male";
    public string Address { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DesignationId { get; set; } = string.Empty;
    public string? SupervisorId { get; set; }
    public string DateOfJoining { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = "Full-Time";
    public string Status { get; set; } = "Active";
    public BankDetailsDto BankDetails { get; set; } = new();
    public EmergencyContactDto EmergencyContact { get; set; } = new();
    public decimal? InitialBasicSalary { get; set; }
}

public class UpdateEmployeeDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DesignationId { get; set; } = string.Empty;
    public string? SupervisorId { get; set; }
    public string EmploymentType { get; set; } = "Full-Time";
    public string Status { get; set; } = "Active";
    public BankDetailsDto BankDetails { get; set; } = new();
    public EmergencyContactDto EmergencyContact { get; set; } = new();
}

public class EmployeeFilterParamsDto : PaginationParams
{
    public string? DepartmentId { get; set; }
    public string? DesignationId { get; set; }
    public string? Status { get; set; }
    public string? EmploymentType { get; set; }
}
