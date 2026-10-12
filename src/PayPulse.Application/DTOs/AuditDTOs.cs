using PayPulse.Application.Common.Models;

namespace PayPulse.Application.DTOs;

public class AuditLogDto
{
    public string Id { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    public string RecordId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public object? OldValues { get; set; }
    public object? NewValues { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class AuditFilterParamsDto : PaginationParams
{
    public string? TableName { get; set; }
    public string? Operation { get; set; }
    public string? UserName { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
}
