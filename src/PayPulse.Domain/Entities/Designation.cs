namespace PayPulse.Domain.Entities;

public class Designation
{
    public int DesignationId { get; set; }
    public int DepartmentId { get; set; }
    public string DesignationTitle { get; set; } = string.Empty;
    public decimal MinSalary { get; set; }
    public decimal MaxSalary { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Department Department { get; set; } = null!;
    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
