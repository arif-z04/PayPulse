using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Enums;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DisbursementsController : ControllerBase
{
    private readonly IDisbursementService _disbursementService;

    public DisbursementsController(IDisbursementService disbursementService)
    {
        _disbursementService = disbursementService;
    }

    [HttpGet]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer},{UserRoles.HrManager}")]
    public async Task<ActionResult<PaginatedResponse<DisbursementDto>>> GetDisbursements([FromQuery] DisbursementFilterParamsDto filter, CancellationToken cancellationToken)
    {
        var result = await _disbursementService.GetDisbursementsAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer},{UserRoles.HrManager}")]
    public async Task<ActionResult<DisbursementDto>> GetDisbursementById(int id, CancellationToken cancellationToken)
    {
        var result = await _disbursementService.GetDisbursementByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id}/retry")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer}")]
    public async Task<ActionResult<DisbursementDto>> RetryDisbursement(int id, CancellationToken cancellationToken)
    {
        var result = await _disbursementService.RetryDisbursementAsync(id, cancellationToken);
        return Ok(result);
    }
}
