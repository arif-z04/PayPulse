using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<AttendanceRecordDto>>> GetAttendance([FromQuery] AttendanceFilterParamsDto filter, CancellationToken cancellationToken)
    {
        var result = await _attendanceService.GetAttendanceAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AttendanceSummaryDto>> GetAttendanceSummary([FromQuery] string? date, CancellationToken cancellationToken)
    {
        DateOnly? parsedDate = null;
        if (!string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var d))
        {
            parsedDate = d;
        }

        var result = await _attendanceService.GetAttendanceSummaryAsync(parsedDate, cancellationToken);
        return Ok(result);
    }

    [HttpPost("check-in")]
    public async Task<ActionResult<AttendanceRecordDto>> CheckIn([FromBody] CheckInRequestDto? request, CancellationToken cancellationToken)
    {
        int? empId = null;
        if (request?.EmployeeId != null && int.TryParse(request.EmployeeId, out var parsed))
        {
            empId = parsed;
        }

        var result = await _attendanceService.CheckInAsync(empId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("check-out")]
    public async Task<ActionResult<AttendanceRecordDto>> CheckOut([FromBody] CheckOutRequestDto? request, CancellationToken cancellationToken)
    {
        int? empId = null;
        if (request?.EmployeeId != null && int.TryParse(request.EmployeeId, out var parsed))
        {
            empId = parsed;
        }

        var result = await _attendanceService.CheckOutAsync(empId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:int}/correct")]
    [Authorize(Roles = "System Administrator,HR Manager,Department Supervisor")]
    public async Task<ActionResult<AttendanceRecordDto>> CorrectAttendance(int id, [FromBody] CorrectAttendanceRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _attendanceService.CorrectAttendanceAsync(id, request, cancellationToken);
        return Ok(result);
    }
}
