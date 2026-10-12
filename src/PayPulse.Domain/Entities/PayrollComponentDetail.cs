namespace PayPulse.Domain.Entities;

public class PayrollComponentDetail
{
    public int DetailId { get; set; }
    public int PayrollId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentType { get; set; } = string.Empty; // Earning, Deduction
    public decimal Amount { get; set; }
    public bool IsTaxable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual MonthlyPayroll MonthlyPayroll { get; set; } = null!;
}
