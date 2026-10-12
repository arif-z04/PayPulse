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
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<EmployeeDto>>> GetEmployees([FromQuery] EmployeeFilterParamsDto filter, CancellationToken cancellationToken)
    {
        var result = await _employeeService.GetEmployeesAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeDto>> GetEmployeeById(int id, CancellationToken cancellationToken)
    {
        var result = await _employeeService.GetEmployeeByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee([FromBody] CreateEmployeeDto dto, CancellationToken cancellationToken)
    {
        var result = await _employeeService.CreateEmployeeAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<ActionResult<EmployeeDto>> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto, CancellationToken cancellationToken)
    {
        var result = await _employeeService.UpdateEmployeeAsync(id, dto, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{UserRoles.SystemAdministrator},{UserRoles.HrManager}")]
    public async Task<IActionResult> DeleteEmployee(int id, CancellationToken cancellationToken)
    {
        await _employeeService.DeleteEmployeeAsync(id, cancellationToken);
        return Ok(new { success = true, message = $"Employee {id} deactivated successfully." });
    }
}
