using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using PayPulse.Domain.Enums;
using PayPulse.Infrastructure.Services;
using Xunit;

namespace PayPulse.UnitTests;

public class SecurityAndAuthTests
{
    [Fact]
    public void PasswordHasher_HashAndVerify_ShouldSucceedForCorrectPassword()
    {
        // Arrange
        var hasher = new BCryptPasswordHasher();
        var rawPassword = "StrongEnterprisePassword@2026!";

        // Act
        var hash = hasher.HashPassword(rawPassword);
        var isValid = hasher.VerifyPassword(rawPassword, hash);
        var isWrongValid = hasher.VerifyPassword("WrongPassword123", hash);

        // Assert
        hash.Should().NotBeNullOrWhiteSpace();
        hash.Should().StartWith("$2");
        isValid.Should().BeTrue();
        isWrongValid.Should().BeFalse();
    }

    [Fact]
    public void JwtTokenGenerator_GenerateToken_ShouldEmbedRequiredClaimsAndExpiry()
    {
        // Arrange
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"Jwt:SecretKey", "PayPulse_SuperSecretEnterpriseKey_2026!#SecureAuthTokenKeyMustBeLongEnough"},
            {"Jwt:Issuer", "PayPulse"},
            {"Jwt:Audience", "PayPulseApp"},
            {"Jwt:ExpiryMinutes", "120"}
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var generator = new JwtTokenGenerator(configuration);

        // Act
        var (token, expiresAt) = generator.GenerateToken(
            userId: 42,
            username: "farzana.hr",
            role: UserRoles.HrManager,
            employeeId: 105,
            email: "farzana.hr@paypulse.internal");

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        expiresAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(115));

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Issuer.Should().Be("PayPulse");
        jwt.Audiences.Should().Contain("PayPulseApp");
        jwt.Claims.First(c => c.Type == "nameid" || c.Type == ClaimTypes.NameIdentifier).Value.Should().Be("42");
        jwt.Claims.First(c => c.Type == "unique_name" || c.Type == ClaimTypes.Name).Value.Should().Be("farzana.hr");
        jwt.Claims.First(c => c.Type == "role" || c.Type == ClaimTypes.Role).Value.Should().Be(UserRoles.HrManager);
        jwt.Claims.First(c => c.Type == "employee_id").Value.Should().Be("105");
        jwt.Claims.First(c => c.Type == "email" || c.Type == ClaimTypes.Email).Value.Should().Be("farzana.hr@paypulse.internal");
    }

    [Fact]
    public void UserRoles_ShouldContainAllFiveStandardRoles()
    {
        UserRoles.All.Should().HaveCount(5);
        UserRoles.All.Should().Contain(UserRoles.SystemAdministrator);
        UserRoles.All.Should().Contain(UserRoles.HrManager);
        UserRoles.All.Should().Contain(UserRoles.PayrollOfficer);
        UserRoles.All.Should().Contain(UserRoles.DepartmentSupervisor);
        UserRoles.All.Should().Contain(UserRoles.Employee);
    }
}
