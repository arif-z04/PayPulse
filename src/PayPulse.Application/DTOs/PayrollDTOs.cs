using PayPulse.Application.Common.Models;

namespace PayPulse.Application.DTOs;

public class PayrollComponentDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Earning"; // Earning or Deduction
    public decimal Amount { get; set; }
    public bool IsTaxable { get; set; } = true;
}

public class PayrollDto
{
    public string Id { get; set; } = string.Empty;
    public string PayrollPeriod { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string BankAccountMasked { get; set; } = string.Empty;
    public int WorkingDays { get; set; }
    public int PresentDays { get; set; }
    public int PaidLeaveDays { get; set; }
    public int UnpaidLeaveDays { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal AllowancesTotal { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal DeductionsTotal { get; set; }
    public decimal TaxDeducted { get; set; }
    public decimal ProvidentFundDeducted { get; set; }
    public decimal OvertimePay { get; set; }
    public decimal NetSalary { get; set; }
    public List<PayrollComponentDetailDto> Components { get; set; } = new();
    public string Status { get; set; } = "Draft"; // Draft, Processing, Approved, Disbursed
    public string ProcessedAt { get; set; } = string.Empty;
    public string? ApprovedAt { get; set; }
    public string? DisbursementReference { get; set; }
}

public class ProcessPayrollBatchRequestDto
{
    public string? Period { get; set; } // e.g. "2026-09"
    public int? Year { get; set; }
    public int? Month { get; set; }
}

public class ProcessPayrollResultDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int ProcessedCount { get; set; }
    public decimal TotalGrossAmount { get; set; }
    public decimal TotalNetAmount { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class PayrollFilterParamsDto : PaginationParams
{
    public string? Period { get; set; }
    public string? Status { get; set; }
    public string? DepartmentName { get; set; }
    public string? EmployeeId { get; set; }
}
