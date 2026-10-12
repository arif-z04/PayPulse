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
public class SalariesController : ControllerBase
{
    private readonly ISalaryService _salaryService;

    public SalariesController(ISalaryService salaryService)
    {
        _salaryService = salaryService;
    }

    [HttpGet]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer},{UserRoles.HrManager}")]
    public async Task<ActionResult<PaginatedResponse<SalaryStructureDto>>> GetSalaries([FromQuery] PaginationParams pagination, CancellationToken cancellationToken)
    {
        var result = await _salaryService.GetSalariesAsync(pagination, cancellationToken);
        return Ok(result);
    }

    [HttpGet("employee/{employeeId}")]
    public async Task<ActionResult<SalaryStructureDto>> GetSalaryByEmployeeId(int employeeId, CancellationToken cancellationToken)
    {
        var result = await _salaryService.GetSalaryByEmployeeIdAsync(employeeId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("employee/{employeeId}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer}")]
    public async Task<ActionResult<SalaryStructureDto>> UpdateSalaryStructure(int employeeId, [FromBody] UpdateSalaryStructureDto dto, CancellationToken cancellationToken)
    {
        var result = await _salaryService.UpdateSalaryStructureAsync(employeeId, dto, cancellationToken);
        return Ok(result);
    }
}
