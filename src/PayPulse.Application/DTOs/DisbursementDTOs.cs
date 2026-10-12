using PayPulse.Application.Common.Models;

namespace PayPulse.Application.DTOs;

public class DisbursementDto
{
    public string Id { get; set; } = string.Empty;
    public string PayrollId { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Period { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "BEFTN";
    public string BankName { get; set; } = string.Empty;
    public string MaskedAccountNumber { get; set; } = string.Empty;
    public string TransactionReference { get; set; } = string.Empty;
    public string DisbursementDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Successful"; // Successful, Processing, Pending, Failed
    public string? FailureReason { get; set; }
}

public class DisbursementFilterParamsDto : PaginationParams
{
    public string? Period { get; set; }
    public string? Status { get; set; }
    public string? PaymentMethod { get; set; }
}
