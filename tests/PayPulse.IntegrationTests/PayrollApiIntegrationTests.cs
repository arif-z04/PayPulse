using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using Xunit;

namespace PayPulse.IntegrationTests;

public class PayrollApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PayrollApiIntegrationTests(CustomWebApplicationFactory factory)
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
    public async Task GetPayrolls_ShouldReturnRecordsFromMySQL()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/payroll?period=2026-08&pageSize=10");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var page = await response.Content.ReadFromJsonAsync<PaginatedResponse<PayrollDto>>();
        page.Should().NotBeNull();
        page!.Items.Should().NotBeEmpty();
        page.TotalCount.Should().BeGreaterThan(0);
        page.Items.First().Components.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ProcessBatch_OnAlreadyDisbursedPeriod_ShouldBePrevented()
    {
        // Period 2026-08 was disbursed in Phase 1 seed data
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/payroll/batch")
        {
            Content = JsonContent.Create(new ProcessPayrollBatchRequestDto
            {
                Year = 2026,
                Month = 8
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert: Idempotency guard blocks regeneration
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
