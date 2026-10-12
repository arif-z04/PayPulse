using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<ActionResult<List<GlobalSearchResultDto>>> Search([FromQuery] string q, CancellationToken cancellationToken)
    {
        var result = await _searchService.SearchGlobalAsync(q, cancellationToken);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SystemNotificationDto>>> GetNotifications(CancellationToken cancellationToken)
    {
        var result = await _notificationService.GetNotificationsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id, CancellationToken cancellationToken)
    {
        await _notificationService.MarkAsReadAsync(id, cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        await _notificationService.MarkAllAsReadAsync(cancellationToken);
        return Ok(new { success = true });
    }
}
