namespace PayPulse.Domain.Entities;

public class Department
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string OfficeLocation { get; set; } = string.Empty;
    public int? HeadOfDepartmentId { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Employee? HeadOfDepartment { get; set; }
    public virtual ICollection<Designation> Designations { get; set; } = new List<Designation>();
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
