namespace PayPulse.Domain.Entities;

public class LeaveRequest
{
    public int RequestId { get; set; }
    public int EmployeeId { get; set; }
    public int LeaveTypeId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TotalDaysRequested { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string ApplicationStatus { get; set; } = "Pending";
    public DateTime AppliedDate { get; set; } = DateTime.UtcNow;
    public int? ApprovedByUserId { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public string? SupervisorComments { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
    public virtual LeaveType LeaveType { get; set; } = null!;
    public virtual UserAccount? ApprovedByUser { get; set; }
}
