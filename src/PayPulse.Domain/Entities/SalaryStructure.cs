namespace PayPulse.Domain.Entities;

public class SalaryStructure
{
    public int StructureId { get; set; }
    public int EmployeeId { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal HouseRentAllowance { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal ConveyanceAllowance { get; set; }
    public decimal SpecialAllowance { get; set; }
    public decimal TaxDeductionRate { get; set; }
    public decimal ProvidentFundRate { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
    public string? RevisionNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Derived properties
    public decimal GrossSalary => BasicSalary + HouseRentAllowance + MedicalAllowance + ConveyanceAllowance + SpecialAllowance;
    public decimal EstimatedTax => (GrossSalary * TaxDeductionRate) / 100m;
    public decimal EstimatedProvidentFund => (GrossSalary * ProvidentFundRate) / 100m;
    public decimal EstimatedNetSalary => GrossSalary - EstimatedTax - EstimatedProvidentFund;

    // Navigation properties
    public virtual Employee Employee { get; set; } = null!;
}
