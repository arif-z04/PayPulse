namespace PayPulse.Application.DTOs;

public class DepartmentPayrollCostDto
{
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int HeadCount { get; set; }
    public decimal GrossPayroll { get; set; }
    public decimal Allowances { get; set; }
    public decimal Deductions { get; set; }
    public decimal NetPayroll { get; set; }
}

public class AttendanceAnalyticsDto
{
    public string Date { get; set; } = string.Empty;
    public int Present { get; set; }
    public int Late { get; set; }
    public int HalfDay { get; set; }
    public int Absent { get; set; }
}

public class LeaveUtilizationDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int CasualUsed { get; set; }
    public int MedicalUsed { get; set; }
    public int EarnedUsed { get; set; }
    public int TotalAllocated { get; set; }
    public int TotalUsed { get; set; }
    public decimal UtilizationRate { get; set; }
}

public class TaxProvidentSummaryDto
{
    public string Period { get; set; } = string.Empty;
    public decimal GrossSalaryTotal { get; set; }
    public decimal TaxWithheldTotal { get; set; }
    public decimal ProvidentFundEmployeeTotal { get; set; }
    public decimal ProvidentFundEmployerTotal { get; set; }
    public decimal TotalStatutoryDeposit { get; set; }
}

public class SalaryBandComplianceDto
{
    public string DesignationId { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal MinAllowed { get; set; }
    public decimal MaxAllowed { get; set; }
    public decimal ActualMin { get; set; }
    public decimal ActualMax { get; set; }
    public decimal ActualAvg { get; set; }
    public int CompliantCount { get; set; }
    public int TotalEmployees { get; set; }
    public bool IsCompliant { get; set; }
}
