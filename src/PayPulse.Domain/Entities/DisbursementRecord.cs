namespace PayPulse.Domain.Entities;

public class DisbursementRecord
{
    public int DisbursementId { get; set; }
    public int PayrollId { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
    public DateTime DisbursementDate { get; set; } = DateTime.UtcNow;
    public string DisbursementMethod { get; set; } = "Bank Transfer (BEFTN)"; // Bank Transfer (BEFTN), Direct Deposit, Cheque, Cash
    public string TargetBankName { get; set; } = string.Empty;
    public string TargetAccountMasked { get; set; } = string.Empty;
    public decimal DisbursedAmount { get; set; }
    public string DisbursementStatus { get; set; } = "Disbursed"; // Pending, Processing, Disbursed, Failed, Reversed
    public string? FailureReason { get; set; }
    public int? AuthorizedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual MonthlyPayroll MonthlyPayroll { get; set; } = null!;
    public virtual UserAccount? AuthorizedByUser { get; set; }
}
