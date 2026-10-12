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
public class LeaveController : ControllerBase
{
    private readonly ILeaveService _leaveService;

    public LeaveController(ILeaveService leaveService)
    {
        _leaveService = leaveService;
    }

    [HttpGet("types")]
    public async Task<ActionResult<List<LeaveTypeDto>>> GetLeaveTypes(CancellationToken cancellationToken)
    {
        var result = await _leaveService.GetLeaveTypesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("allocations")]
    public async Task<ActionResult<List<LeaveAllocationDto>>> GetLeaveAllocations([FromQuery] string? employeeId, CancellationToken cancellationToken)
    {
        int? parsedEmpId = null;
        if (!string.IsNullOrWhiteSpace(employeeId) && int.TryParse(employeeId, out var id))
        {
            parsedEmpId = id;
        }

        var result = await _leaveService.GetLeaveAllocationsAsync(parsedEmpId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("requests")]
    public async Task<ActionResult<PaginatedResponse<LeaveRequestDto>>> GetLeaveRequests([FromQuery] LeaveRequestFilterParamsDto filter, CancellationToken cancellationToken)
    {
        var result = await _leaveService.GetLeaveRequestsAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpPost("requests")]
    public async Task<ActionResult<LeaveRequestDto>> SubmitLeaveRequest([FromBody] SubmitLeaveRequestDto dto, CancellationToken cancellationToken)
    {
        var result = await _leaveService.SubmitLeaveRequestAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("requests/{id}/approve")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager},{UserRoles.DepartmentSupervisor}")]
    public async Task<ActionResult<LeaveRequestDto>> ApproveLeaveRequest(int id, [FromBody] ApproveLeaveRequestDto dto, CancellationToken cancellationToken)
    {
        var result = await _leaveService.ApproveLeaveRequestAsync(id, dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("requests/{id}/reject")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager},{UserRoles.DepartmentSupervisor}")]
    public async Task<ActionResult<LeaveRequestDto>> RejectLeaveRequest(int id, [FromBody] RejectLeaveRequestDto dto, CancellationToken cancellationToken)
    {
        var result = await _leaveService.RejectLeaveRequestAsync(id, dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("requests/{id}/cancel")]
    public async Task<ActionResult<LeaveRequestDto>> CancelLeaveRequest(int id, CancellationToken cancellationToken)
    {
        var result = await _leaveService.CancelLeaveRequestAsync(id, cancellationToken);
        return Ok(result);
    }
}
