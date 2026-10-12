using PayPulse.Application.Common.Interfaces;

namespace PayPulse.Infrastructure.Services;

public class BCryptPasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.EnhancedHashPassword(password, 12);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
            return false;

        try
        {
            // First try standard/enhanced verification
            if (BCrypt.Net.BCrypt.EnhancedVerify(password, passwordHash))
                return true;
        }
        catch
        {
            // Fall back to standard BCrypt verify
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch
        {
            return false;
        }
    }
}
