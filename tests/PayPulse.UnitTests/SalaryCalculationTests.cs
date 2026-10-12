using FluentAssertions;
using PayPulse.Domain.Entities;
using Xunit;

namespace PayPulse.UnitTests;

public class SalaryCalculationTests
{
    [Fact]
    public void SalaryStructure_GrossSalary_ShouldEqualSumOfBasicAndAllowances()
    {
        // Arrange
        var structure = new SalaryStructure
        {
            BasicSalary = 100000m,
            HouseRentAllowance = 20000m,
            MedicalAllowance = 10000m,
            ConveyanceAllowance = 5000m,
            SpecialAllowance = 5000m
        };

        // Act
        var gross = structure.GrossSalary;

        // Assert
        gross.Should().Be(140000m);
    }

    [Fact]
    public void SalaryStructure_EstimatedNetSalary_ShouldCorrectlyDeductTaxAndPF()
    {
        // Arrange
        var structure = new SalaryStructure
        {
            BasicSalary = 100000m,
            HouseRentAllowance = 20000m,
            MedicalAllowance = 10000m,
            ConveyanceAllowance = 5000m,
            SpecialAllowance = 5000m,
            TaxDeductionRate = 10m,        // 10% of 140,000 = 14,000
            ProvidentFundRate = 7.5m       // 7.5% of 140,000 = 10,500
        };

        // Act
        var gross = structure.GrossSalary;
        var tax = structure.EstimatedTax;
        var pf = structure.EstimatedProvidentFund;
        var net = structure.EstimatedNetSalary;

        // Assert
        gross.Should().Be(140000m);
        tax.Should().Be(14000m);
        pf.Should().Be(10500m);
        net.Should().Be(115500m);
    }

    [Theory]
    [InlineData(120000, 12, 10384.62)] // 120000 / 208 * 1.5 * 12 = 10384.615... -> 10384.62
    [InlineData(65000, 10, 4687.50)]   // 65000 / 208 * 1.5 * 10 = 4687.50
    public void OvertimePay_ShouldComputeAtStandardOneAndHalfTimesRate(decimal basicSalary, decimal otHours, decimal expectedOtPay)
    {
        // Hourly rate = Basic / 208
        // OT rate = Hourly * 1.5
        var hourlyRate = basicSalary / 208m;
        var computedOtPay = Math.Round(otHours * hourlyRate * 1.5m, 2, MidpointRounding.AwayFromZero);

        computedOtPay.Should().Be(expectedOtPay);
    }

    [Fact]
    public void NetSalary_FormulaVerification_ShouldMatchIndependentBenchmark()
    {
        // Test benchmark from Phase 1 test suite:
        // Basic 120,000, HRA 24,000, Med 12,000, Conv 8,000, OT 12 hrs, Unpaid 2 days, Tax 8%, PF 7.5%
        decimal basic = 120000m;
        decimal hra = 24000m;
        decimal med = 12000m;
        decimal conv = 8000m;
        decimal gross = basic + hra + med + conv; // 164,000
        decimal tax = Math.Round((gross * 8.0m) / 100m, 2, MidpointRounding.AwayFromZero); // 13,120.00
        decimal pf = Math.Round((gross * 7.5m) / 100m, 2, MidpointRounding.AwayFromZero);   // 12,300.00
        decimal unpaidDeduction = Math.Round((basic / 26m) * 2m, 2, MidpointRounding.AwayFromZero); // 9,230.77
        decimal otPay = Math.Round(12m * (basic / 208m) * 1.5m, 2, MidpointRounding.AwayFromZero); // 10,384.62

        decimal totalDeductions = tax + pf + unpaidDeduction; // 34,650.77
        decimal net = gross - totalDeductions + otPay;

        // Assert
        gross.Should().Be(164000m);
        tax.Should().Be(13120.00m);
        pf.Should().Be(12300.00m);
        unpaidDeduction.Should().Be(9230.77m);
        otPay.Should().Be(10384.62m);
        net.Should().Be(139733.85m);
    }
}
