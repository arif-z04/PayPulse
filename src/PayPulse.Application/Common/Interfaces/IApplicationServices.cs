namespace PayPulse.Application.Common.Interfaces;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Username { get; }
    string? Role { get; }
    int? EmployeeId { get; }
    string? IpAddress { get; }
    bool IsAuthenticated { get; }
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(int userId, string username, string role, int? employeeId, string email);
}
