using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using Xunit;

namespace PayPulse.IntegrationTests;

public class EmployeeApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public EmployeeApiIntegrationTests(CustomWebApplicationFactory factory)
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
    public async Task GetEmployees_ShouldReturnPaginatedResultsFromMySQL()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/employees?page=1&pageSize=10");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var page = await response.Content.ReadFromJsonAsync<PaginatedResponse<EmployeeDto>>();
        page.Should().NotBeNull();
        page!.Items.Should().NotBeEmpty();
        page.TotalCount.Should().BeGreaterThanOrEqualTo(100); // 105 seeded in Phase 1
        page.Items.Count.Should().Be(10);
    }

    [Fact]
    public async Task GetEmployeeById_WithValidId_ShouldReturnEmployeeDetails()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/employees/1");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var emp = await response.Content.ReadFromJsonAsync<EmployeeDto>();
        emp.Should().NotBeNull();
        emp!.Id.Should().Be("1");
        emp.EmployeeCode.Should().Be("EMP-1001");
        emp.BankDetails.Should().NotBeNull();
        emp.BankDetails.AccountNumber.Should().Contain("*"); // Masked
    }

    [Fact]
    public async Task GetEmployees_FilteredByDepartment_ShouldOnlyReturnMatchingEmployees()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/employees?departmentId=1&pageSize=50");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var page = await response.Content.ReadFromJsonAsync<PaginatedResponse<EmployeeDto>>();
        page.Should().NotBeNull();
        page!.Items.Should().OnlyContain(e => e.DepartmentId == "1");
    }
}
