using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Enums;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DesignationsController : ControllerBase
{
    private readonly IDesignationService _designationService;

    public DesignationsController(IDesignationService designationService)
    {
        _designationService = designationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DesignationDto>>> GetDesignations([FromQuery] int? departmentId, CancellationToken cancellationToken)
    {
        var result = await _designationService.GetDesignationsAsync(departmentId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DesignationDto>> GetDesignationById(int id, CancellationToken cancellationToken)
    {
        var result = await _designationService.GetDesignationByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<ActionResult<DesignationDto>> CreateDesignation([FromBody] CreateDesignationDto dto, CancellationToken cancellationToken)
    {
        var result = await _designationService.CreateDesignationAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetDesignationById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<ActionResult<DesignationDto>> UpdateDesignation(int id, [FromBody] UpdateDesignationDto dto, CancellationToken cancellationToken)
    {
        var result = await _designationService.UpdateDesignationAsync(id, dto, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<IActionResult> DeleteDesignation(int id, CancellationToken cancellationToken)
    {
        await _designationService.DeleteDesignationAsync(id, cancellationToken);
        return Ok(new { success = true, message = $"Designation {id} deactivated successfully." });
    }
}
