using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PayPulse.Application.DTOs;
using Xunit;

namespace PayPulse.IntegrationTests;

public class LeaveAndAttendanceApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LeaveAndAttendanceApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            EmailOrUsername = "admin",
            Password = "Password@123"
        });
        var data = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        return data!.AccessToken;
    }

    [Fact]
    public async Task GetLeaveTypes_ShouldReturnAllSixStatutoryLeaveTypes()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/leave/types");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var types = await response.Content.ReadFromJsonAsync<List<LeaveTypeDto>>();
        types.Should().NotBeNull();
        types!.Should().HaveCountGreaterThanOrEqualTo(6);
        types.Select(t => t.Name).Should().Contain("Casual Leave");
        types.Select(t => t.Name).Should().Contain("Medical Leave");
        types.Select(t => t.Name).Should().Contain("Earned Leave");
    }

    [Fact]
    public async Task GetAttendanceSummary_ShouldReturnAggregateMetrics()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/attendance/summary");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var summary = await response.Content.ReadFromJsonAsync<AttendanceSummaryDto>();
        summary.Should().NotBeNull();
        summary!.Total.Should().BeGreaterThan(0);
    }
}
