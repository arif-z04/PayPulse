namespace PayPulse.Application.DTOs;

public class DesignationDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal MinSalary { get; set; }
    public decimal MaxSalary { get; set; }
    public int EmployeeCount { get; set; }
    public string? Description { get; set; }
}

public class CreateDesignationDto
{
    public string Title { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public decimal MinSalary { get; set; }
    public decimal MaxSalary { get; set; }
    public string? Description { get; set; }
}

public class UpdateDesignationDto
{
    public string? Title { get; set; }
    public string? DepartmentId { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}
