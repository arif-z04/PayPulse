using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PayPulse.Application.Common.Interfaces;

namespace PayPulse.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? UserId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }

    public string? Username => _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Name)?.Value;

    public string? Role => _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value;

    public int? EmployeeId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirst("employee_id")?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }

    public string? IpAddress => _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
