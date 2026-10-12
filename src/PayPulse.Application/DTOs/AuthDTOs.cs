namespace PayPulse.Application.DTOs;

public class LoginRequestDto
{
    public string EmailOrUsername { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public string? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public UserDto User { get; set; } = null!;
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public string ExpiresAt { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}
