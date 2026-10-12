namespace PayPulse.Domain.Entities;

public class MonthlyPayroll
{
    public int PayrollId { get; set; }
    public int EmployeeId { get; set; }
    public int PayrollYear { get; set; }
    public int PayrollMonth { get; set; }
    public int WorkingDaysInMonth { get; set; }
    public int PresentDays { get; set; }
    public int PaidLeaveDays { get; set; }
    public int UnpaidLeaveDays { get; set; }
    public decimal BasicSalarySnapshot { get; set; }
    public decimal TotalAllowances { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal TaxDeducted { get; set; }
    public decimal ProvidentFundDeducted { get; set; }
    public decimal OvertimePay { get; set; }
    public decimal NetSalary { get; set; }
    public string PayrollStatus { get; set; } = "Draft"; // Draft, Finalized, Disbursed
    public int? ProcessedByUserId { get; set; }
    public DateTime ProcessedDate { get; set; } = DateTime.UtcNow;
    public DateTime? FinalizedDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
    public virtual UserAccount? ProcessedByUser { get; set; }
    public virtual ICollection<PayrollComponentDetail> Components { get; set; } = new List<PayrollComponentDetail>();
    public virtual DisbursementRecord? Disbursement { get; set; }
}
