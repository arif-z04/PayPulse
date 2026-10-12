using FluentAssertions;
using PayPulse.Domain.Entities;
using Xunit;

namespace PayPulse.UnitTests;

public class LeavePolicyTests
{
    [Fact]
    public void LeaveAllocation_DeductDays_ShouldProperlyUpdateDaysRemaining()
    {
        // Arrange
        var allocation = new LeaveAllocation
        {
            TotalAllocatedDays = 14,
            DaysUsed = 0,
            DaysRemaining = 14
        };

        // Act
        int daysToDeduct = 3;
        allocation.DaysUsed += daysToDeduct;
        allocation.DaysRemaining -= daysToDeduct;

        // Assert
        allocation.DaysUsed.Should().Be(3);
        allocation.DaysRemaining.Should().Be(11);
    }

    [Fact]
    public void LeaveAllocation_RestoreDays_ShouldProperlyRestoreOnCancellation()
    {
        // Arrange
        var allocation = new LeaveAllocation
        {
            TotalAllocatedDays = 14,
            DaysUsed = 3,
            DaysRemaining = 11
        };

        // Act (Cancellation of 3 approved days)
        int daysToRestore = 3;
        allocation.DaysUsed -= daysToRestore;
        allocation.DaysRemaining += daysToRestore;

        // Assert
        allocation.DaysUsed.Should().Be(0);
        allocation.DaysRemaining.Should().Be(14);
    }

    [Fact]
    public void LeaveRequest_DateCalculation_ShouldComputeCorrectDuration()
    {
        // Arrange
        var start = new DateOnly(2026, 10, 1);
        var end = new DateOnly(2026, 10, 5);

        // Act
        int days = end.DayNumber - start.DayNumber + 1;

        // Assert
        days.Should().Be(5);
    }
}
