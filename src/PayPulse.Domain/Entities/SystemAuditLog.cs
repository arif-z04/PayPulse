namespace PayPulse.Domain.Entities;

public class SystemAuditLog
{
    public long AuditId { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    public string RecordId { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public string Description { get; set; } = string.Empty;
    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual UserAccount? User { get; set; }
}
