namespace PayPulse.Domain.Entities;

public class AttendanceLog
{
    public int LogId { get; set; }
    public int EmployeeId { get; set; }
    public DateOnly WorkDate { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal TotalHoursWorked { get; set; }
    public decimal OvertimeHours { get; set; }
    public string AttendanceStatus { get; set; } = "Present";
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
}
