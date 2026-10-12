namespace PayPulse.Domain.Entities;

public class LeaveType
{
    public int LeaveTypeId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string TypeCode { get; set; } = string.Empty;
    public int AnnualQuota { get; set; }
    public bool IsPaid { get; set; } = true;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<LeaveAllocation> LeaveAllocations { get; set; } = new List<LeaveAllocation>();
    public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
}
