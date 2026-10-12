using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Enums;

namespace PayPulse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentsController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetDepartments(CancellationToken cancellationToken)
    {
        var result = await _departmentService.GetDepartmentsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentDto>> GetDepartmentById(int id, CancellationToken cancellationToken)
    {
        var result = await _departmentService.GetDepartmentByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<ActionResult<DepartmentDto>> CreateDepartment([FromBody] CreateDepartmentDto dto, CancellationToken cancellationToken)
    {
        var result = await _departmentService.CreateDepartmentAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetDepartmentById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<ActionResult<DepartmentDto>> UpdateDepartment(int id, [FromBody] UpdateDepartmentDto dto, CancellationToken cancellationToken)
    {
        var result = await _departmentService.UpdateDepartmentAsync(id, dto, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<IActionResult> DeleteDepartment(int id, CancellationToken cancellationToken)
    {
        await _departmentService.DeleteDepartmentAsync(id, cancellationToken);
        return Ok(new { success = true, message = $"Department {id} deactivated successfully." });
    }
}
