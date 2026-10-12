namespace PayPulse.Domain.Entities;

public class Employee
{
    public int EmployeeId { get; set; }
    public int UserId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string OfficialEmail { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string NidNumber { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string ResidentialAddress { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public int DesignationId { get; set; }
    public int? ManagerId { get; set; }
    public DateOnly DateOfJoining { get; set; }
    public string EmploymentType { get; set; } = string.Empty;
    public string EmploymentStatus { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BankBranch { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string RoutingNumber { get; set; } = string.Empty;
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactRelation { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Derived full name
    public string FullName => $"{FirstName} {LastName}".Trim();

    // Navigation properties
    public virtual UserAccount UserAccount { get; set; } = null!;
    public virtual Department Department { get; set; } = null!;
    public virtual Designation Designation { get; set; } = null!;
    public virtual Employee? Manager { get; set; }
    public virtual ICollection<Employee> DirectReports { get; set; } = new List<Employee>();
    public virtual ICollection<SalaryStructure> SalaryStructures { get; set; } = new List<SalaryStructure>();
    public virtual ICollection<AttendanceLog> AttendanceLogs { get; set; } = new List<AttendanceLog>();
    public virtual ICollection<LeaveAllocation> LeaveAllocations { get; set; } = new List<LeaveAllocation>();
    public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    public virtual ICollection<MonthlyPayroll> MonthlyPayrolls { get; set; } = new List<MonthlyPayroll>();
}
