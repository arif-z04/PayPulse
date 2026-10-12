namespace PayPulse.Application.DTOs;

public class SalaryStructureDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public decimal BasicSalary { get; set; }
    public decimal HouseRentAllowance { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal ConveyanceAllowance { get; set; }
    public decimal SpecialAllowance { get; set; }
    public decimal TaxDeductionRate { get; set; }
    public decimal ProvidentFundRate { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal EstimatedNetSalary { get; set; }
    public string EffectiveDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Active"; // Active, Archived
    public string? RevisionNote { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class UpdateSalaryStructureDto
{
    public decimal? BasicSalary { get; set; }
    public decimal? HouseRentAllowance { get; set; }
    public decimal? MedicalAllowance { get; set; }
    public decimal? ConveyanceAllowance { get; set; }
    public decimal? SpecialAllowance { get; set; }
    public decimal? TaxDeductionRate { get; set; }
    public decimal? ProvidentFundRate { get; set; }
    public string? EffectiveDate { get; set; }
    public string? RevisionNote { get; set; }
}
