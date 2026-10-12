using PayPulse.Application.Common.Models;

namespace PayPulse.Application.DTOs;

public class LeaveTypeDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int AnnualQuota { get; set; }
    public bool IsPaid { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class LeaveAllocationDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string LeaveTypeId { get; set; } = string.Empty;
    public string LeaveTypeName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int TotalDays { get; set; }
    public int UsedDays { get; set; }
    public int PendingDays { get; set; }
    public int RemainingDays { get; set; }
}

public class LeaveRequestDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string LeaveTypeId { get; set; } = string.Empty;
    public string LeaveTypeName { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string AppliedDate { get; set; } = string.Empty;
    public string? ApprovedBySupervisorDate { get; set; }
    public string? ApprovedByHrDate { get; set; }
    public string? SupervisorComment { get; set; }
    public string? HrComment { get; set; }
}

public class SubmitLeaveRequestDto
{
    public string? EmployeeId { get; set; }
    public string LeaveTypeId { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ApproveLeaveRequestDto
{
    public string? Comment { get; set; }
    public string? Role { get; set; }
}

public class RejectLeaveRequestDto
{
    public string Comment { get; set; } = string.Empty;
}

public class LeaveRequestFilterParamsDto : PaginationParams
{
    public string? Status { get; set; }
    public string? EmployeeId { get; set; }
    public string? DepartmentName { get; set; }
}
