using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Enums;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<AuditLogDto>>> GetAuditLogs([FromQuery] AuditFilterParamsDto filter, CancellationToken cancellationToken)
    {
        var result = await _auditService.GetAuditLogsAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AuditLogDto>> GetAuditLogById(long id, CancellationToken cancellationToken)
    {
        var result = await _auditService.GetAuditLogByIdAsync(id, cancellationToken);
        return Ok(result);
    }
}
