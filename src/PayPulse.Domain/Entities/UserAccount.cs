namespace PayPulse.Domain.Entities;

public class UserAccount
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Employee? Employee { get; set; }
    public virtual ICollection<LeaveRequest> ApprovedLeaveRequests { get; set; } = new List<LeaveRequest>();
    public virtual ICollection<MonthlyPayroll> ProcessedPayrolls { get; set; } = new List<MonthlyPayroll>();
    public virtual ICollection<DisbursementRecord> AuthorizedDisbursements { get; set; } = new List<DisbursementRecord>();
    public virtual ICollection<SystemAuditLog> AuditLogs { get; set; } = new List<SystemAuditLog>();
}
