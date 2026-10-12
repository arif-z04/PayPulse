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
public class PayrollController : ControllerBase
{
    private readonly IPayrollService _payrollService;

    public PayrollController(IPayrollService payrollService)
    {
        _payrollService = payrollService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<PayrollDto>>> GetPayrolls([FromQuery] PayrollFilterParamsDto filter, CancellationToken cancellationToken)
    {
        var result = await _payrollService.GetPayrollsAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PayrollDto>> GetPayrollById(int id, CancellationToken cancellationToken)
    {
        var result = await _payrollService.GetPayrollByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("batch")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer}")]
    public async Task<ActionResult<ProcessPayrollResultDto>> ProcessBatch([FromBody] ProcessPayrollBatchRequestDto request, CancellationToken cancellationToken)
    {
        int year = request.Year ?? DateTime.UtcNow.Year;
        int month = request.Month ?? DateTime.UtcNow.Month;

        if (!string.IsNullOrWhiteSpace(request.Period))
        {
            var parts = request.Period.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[0], out var y) && int.TryParse(parts[1], out var m))
            {
                year = y;
                month = m;
            }
        }

        var result = await _payrollService.ProcessMonthlyPayrollBatchAsync(year, month, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer}")]
    public async Task<ActionResult<PayrollDto>> ApprovePayroll(int id, CancellationToken cancellationToken)
    {
        var result = await _payrollService.FinalizePayrollAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id}/disburse")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer}")]
    public async Task<ActionResult<PayrollDto>> DisbursePayroll(int id, CancellationToken cancellationToken)
    {
        var result = await _payrollService.DisbursePayrollAsync(id, cancellationToken);
        return Ok(result);
    }
}
