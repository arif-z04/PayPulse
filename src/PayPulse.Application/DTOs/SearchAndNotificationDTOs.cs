namespace PayPulse.Application.DTOs;

public class GlobalSearchResultDto
{
    public string Type { get; set; } = string.Empty; // employee, department, payroll, leave, report
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class SystemNotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Category { get; set; } = "system"; // payroll, leave, attendance, security, system
    public bool IsRead { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? Link { get; set; }
}
