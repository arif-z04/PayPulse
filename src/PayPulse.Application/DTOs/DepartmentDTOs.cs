namespace PayPulse.Application.DTOs;

public class DepartmentDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? HeadOfDepartmentId { get; set; }
    public string? HeadOfDepartmentName { get; set; }
    public int EmployeeCount { get; set; }
    public string? Description { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateDepartmentDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? HeadOfDepartmentId { get; set; }
    public string? Description { get; set; }
}

public class UpdateDepartmentDto
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Location { get; set; }
    public string? HeadOfDepartmentId { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}
