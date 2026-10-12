using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Enums;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("payroll-cost")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer},{UserRoles.HrManager},{UserRoles.DepartmentSupervisor}")]
    public async Task<ActionResult<List<DepartmentPayrollCostDto>>> GetDepartmentPayrollCost([FromQuery] string period = "2026-09", CancellationToken cancellationToken = default)
    {
        var result = await _reportService.GetDepartmentPayrollCostAsync(period, cancellationToken);
        return Ok(result);
    }

    [HttpGet("attendance-trend")]
    public async Task<ActionResult<List<AttendanceAnalyticsDto>>> GetAttendanceTrend(CancellationToken cancellationToken)
    {
        var result = await _reportService.GetAttendanceTrendAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("leave-utilization")]
    public async Task<ActionResult<List<LeaveUtilizationDto>>> GetLeaveUtilization(CancellationToken cancellationToken)
    {
        var result = await _reportService.GetLeaveUtilizationAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("tax-provident")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer}")]
    public async Task<ActionResult<TaxProvidentSummaryDto>> GetTaxProvidentSummary([FromQuery] string period = "2026-09", CancellationToken cancellationToken = default)
    {
        var result = await _reportService.GetTaxProvidentSummaryAsync(period, cancellationToken);
        return Ok(result);
    }

    [HttpGet("salary-band-compliance")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.PayrollOfficer},{UserRoles.HrManager}")]
    public async Task<ActionResult<List<SalaryBandComplianceDto>>> GetSalaryBandCompliance(CancellationToken cancellationToken)
    {
        var result = await _reportService.GetSalaryBandComplianceAsync(cancellationToken);
        return Ok(result);
    }
}
