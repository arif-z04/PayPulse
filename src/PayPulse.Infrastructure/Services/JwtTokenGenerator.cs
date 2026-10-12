using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PayPulse.Application.Common.Interfaces;

namespace PayPulse.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAt) GenerateToken(int userId, string username, string role, int? employeeId, string email)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "PayPulse_SuperSecretEnterpriseKey_2026!#SecureAuthTokenKeyMustBeLongEnough";
        var issuer = _configuration["Jwt:Issuer"] ?? "PayPulse";
        var audience = _configuration["Jwt:Audience"] ?? "PayPulseApp";
        var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes) ? minutes : 480;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, username),
            new(ClaimTypes.Role, role),
            new(ClaimTypes.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (employeeId.HasValue)
        {
            claims.Add(new Claim("employee_id", employeeId.Value.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(securityToken);

        return (tokenString, expiresAt);
    }
}
