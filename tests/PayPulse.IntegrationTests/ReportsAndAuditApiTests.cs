using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PayPulse.Application.DTOs;
using Xunit;

namespace PayPulse.IntegrationTests;

public class ReportsAndAuditApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ReportsAndAuditApiTests(CustomWebApplicationFactory factory)
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
    public async Task GetDepartmentPayrollCost_ShouldReturnAggregatesAcrossAllDepartments()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/reports/payroll-cost?period=2026-08");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var reports = await response.Content.ReadFromJsonAsync<List<DepartmentPayrollCostDto>>();
        reports.Should().NotBeNull();
        reports!.Should().NotBeEmpty();
        reports.Should().HaveCountGreaterThanOrEqualTo(5);
        reports.Sum(r => r.GrossPayroll).Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GlobalSearch_WithValidQuery_ShouldReturnRelevantResults()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/search?q=Engineering");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var results = await response.Content.ReadFromJsonAsync<List<GlobalSearchResultDto>>();
        results.Should().NotBeNull();
        results!.Should().NotBeEmpty();
    }
}
