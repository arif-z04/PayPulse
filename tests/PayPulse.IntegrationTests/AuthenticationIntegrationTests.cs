using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using PayPulse.Application.DTOs;
using Xunit;

namespace PayPulse.IntegrationTests;

public class AuthenticationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthenticationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithValidAdminCredentials_ShouldReturnOkAndJwtToken()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "admin",
            Password = "Password@123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        content.Should().NotBeNull();
        content!.AccessToken.Should().NotBeNullOrWhiteSpace();
        content.User.Should().NotBeNull();
        content.User.Username.Should().Be("admin");
        content.User.Role.Should().Be("System Administrator");
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            EmailOrUsername = "admin",
            Password = "WrongPassword_TotallyInvalid"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_WithValidToken_ShouldReturnCurrentProfile()
    {
        // Arrange
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            EmailOrUsername = "admin",
            Password = "Password@123"
        });
        var authData = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authData!.AccessToken);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        user.Should().NotBeNull();
        user!.Username.Should().Be("admin");
    }

    [Fact]
    public async Task AdminOnlyEndpoint_WhenAccessedByEmployee_ShouldReturnForbidden()
    {
        // Arrange: login as standard employee
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            EmailOrUsername = "nusrat.employee",
            Password = "Password@123"
        });
        var authData = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/audit");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authData!.AccessToken);

        // Act: Employee tries to access audit log
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
