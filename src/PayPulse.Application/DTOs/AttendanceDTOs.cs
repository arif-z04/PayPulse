using PayPulse.Application.Common.Models;

namespace PayPulse.Application.DTOs;

public class AttendanceRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string? CheckInTime { get; set; }
    public string? CheckOutTime { get; set; }
    public decimal WorkingHours { get; set; }
    public decimal OvertimeHours { get; set; }
    public string Status { get; set; } = "Present";
    public string? Remarks { get; set; }
}

public class AttendanceSummaryDto
{
    public int Total { get; set; }
    public int Present { get; set; }
    public int Late { get; set; }
    public int HalfDay { get; set; }
    public int Absent { get; set; }
    public int AttendanceRate { get; set; }
}

public class CheckInRequestDto
{
    public string? EmployeeId { get; set; }
}

public class CheckOutRequestDto
{
    public string? EmployeeId { get; set; }
}

public class AttendanceFilterParamsDto : PaginationParams
{
    public string? Date { get; set; }
    public string? EmployeeId { get; set; }
    public string? DepartmentName { get; set; }
    public string? Status { get; set; }
}

public class CorrectAttendanceRequestDto
{
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? Status { get; set; }
    public string? Remarks { get; set; }
}
