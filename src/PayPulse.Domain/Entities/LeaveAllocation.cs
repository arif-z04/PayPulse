namespace PayPulse.Domain.Entities;

public class LeaveAllocation
{
    public int AllocationId { get; set; }
    public int EmployeeId { get; set; }
    public int LeaveTypeId { get; set; }
    public int CalendarYear { get; set; }
    public int TotalAllocatedDays { get; set; }
    public int DaysUsed { get; set; }
    public int DaysRemaining { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
    public virtual LeaveType LeaveType { get; set; } = null!;
}
