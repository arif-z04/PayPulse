using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.LoginAsync(request, ip, cancellationToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        return Ok(new { success = true, message = "Logged out successfully." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var user = await _authService.GetCurrentUserAsync(cancellationToken);
        if (user == null) return NotFound(new { message = "User not found." });
        return Ok(user);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request, CancellationToken cancellationToken)
    {
        await _authService.ChangePasswordAsync(request, cancellationToken);
        return Ok(new { success = true, message = "Password updated successfully." });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request, CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(request.Email, cancellationToken);
        return Ok(new
        {
            success = true,
            message = $"Password reset instructions have been dispatched to {request.Email}. Check your corporate inbox."
        });
    }
}
