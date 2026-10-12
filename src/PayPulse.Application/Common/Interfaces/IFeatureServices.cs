using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;

namespace PayPulse.Application.Common.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserAsync(CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(ChangePasswordDto request, CancellationToken cancellationToken = default);
    Task<bool> ForgotPasswordAsync(string email, CancellationToken cancellationToken = default);
}

public interface IEmployeeService
{
    Task<PaginatedResponse<EmployeeDto>> GetEmployeesAsync(EmployeeFilterParamsDto filter, CancellationToken cancellationToken = default);
    Task<EmployeeDto> GetEmployeeByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default);
    Task<EmployeeDto> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteEmployeeAsync(int id, CancellationToken cancellationToken = default);
}

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<DepartmentDto> GetDepartmentByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto, CancellationToken cancellationToken = default);
    Task<DepartmentDto> UpdateDepartmentAsync(int id, UpdateDepartmentDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteDepartmentAsync(int id, CancellationToken cancellationToken = default);
}

public interface IDesignationService
{
    Task<List<DesignationDto>> GetDesignationsAsync(int? departmentId = null, CancellationToken cancellationToken = default);
    Task<DesignationDto> GetDesignationByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DesignationDto> CreateDesignationAsync(CreateDesignationDto dto, CancellationToken cancellationToken = default);
    Task<DesignationDto> UpdateDesignationAsync(int id, UpdateDesignationDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteDesignationAsync(int id, CancellationToken cancellationToken = default);
}

public interface ISalaryService
{
    Task<PaginatedResponse<SalaryStructureDto>> GetSalariesAsync(PaginationParams pagination, CancellationToken cancellationToken = default);
    Task<SalaryStructureDto> GetSalaryByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default);
    Task<SalaryStructureDto> UpdateSalaryStructureAsync(int employeeId, UpdateSalaryStructureDto dto, CancellationToken cancellationToken = default);
}

public interface IAttendanceService
{
    Task<PaginatedResponse<AttendanceRecordDto>> GetAttendanceAsync(AttendanceFilterParamsDto filter, CancellationToken cancellationToken = default);
    Task<AttendanceSummaryDto> GetAttendanceSummaryAsync(DateOnly? date = null, CancellationToken cancellationToken = default);
    Task<AttendanceRecordDto> CheckInAsync(int? employeeId = null, CancellationToken cancellationToken = default);
    Task<AttendanceRecordDto> CheckOutAsync(int? employeeId = null, CancellationToken cancellationToken = default);
    Task<AttendanceRecordDto> CorrectAttendanceAsync(int id, CorrectAttendanceRequestDto dto, CancellationToken cancellationToken = default);
}

public interface ILeaveService
{
    Task<List<LeaveTypeDto>> GetLeaveTypesAsync(CancellationToken cancellationToken = default);
    Task<List<LeaveAllocationDto>> GetLeaveAllocationsAsync(int? employeeId = null, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<LeaveRequestDto>> GetLeaveRequestsAsync(LeaveRequestFilterParamsDto filter, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> SubmitLeaveRequestAsync(SubmitLeaveRequestDto dto, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> ApproveLeaveRequestAsync(int id, ApproveLeaveRequestDto dto, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> RejectLeaveRequestAsync(int id, RejectLeaveRequestDto dto, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> CancelLeaveRequestAsync(int id, CancellationToken cancellationToken = default);
}

public interface IPayrollService
{
    Task<PaginatedResponse<PayrollDto>> GetPayrollsAsync(PayrollFilterParamsDto filter, CancellationToken cancellationToken = default);
    Task<PayrollDto> GetPayrollByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ProcessPayrollResultDto> ProcessMonthlyPayrollBatchAsync(int year, int month, CancellationToken cancellationToken = default);
    Task<PayrollDto> FinalizePayrollAsync(int id, CancellationToken cancellationToken = default);
    Task<PayrollDto> DisbursePayrollAsync(int id, CancellationToken cancellationToken = default);
}

public interface IDisbursementService
{
    Task<PaginatedResponse<DisbursementDto>> GetDisbursementsAsync(DisbursementFilterParamsDto filter, CancellationToken cancellationToken = default);
    Task<DisbursementDto> GetDisbursementByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DisbursementDto> RetryDisbursementAsync(int id, CancellationToken cancellationToken = default);
}

public interface IAuditService
{
    Task<PaginatedResponse<AuditLogDto>> GetAuditLogsAsync(AuditFilterParamsDto filter, CancellationToken cancellationToken = default);
    Task<AuditLogDto> GetAuditLogByIdAsync(long id, CancellationToken cancellationToken = default);
    Task LogAsync(string tableName, string operation, string recordId, object? oldValues, object? newValues, string description, CancellationToken cancellationToken = default);
}

public interface IReportService
{
    Task<List<DepartmentPayrollCostDto>> GetDepartmentPayrollCostAsync(string period, CancellationToken cancellationToken = default);
    Task<List<AttendanceAnalyticsDto>> GetAttendanceTrendAsync(CancellationToken cancellationToken = default);
    Task<List<LeaveUtilizationDto>> GetLeaveUtilizationAsync(CancellationToken cancellationToken = default);
    Task<TaxProvidentSummaryDto> GetTaxProvidentSummaryAsync(string period, CancellationToken cancellationToken = default);
    Task<List<SalaryBandComplianceDto>> GetSalaryBandComplianceAsync(CancellationToken cancellationToken = default);
}

public interface ISearchService
{
    Task<List<GlobalSearchResultDto>> SearchGlobalAsync(string query, CancellationToken cancellationToken = default);
}

public interface INotificationService
{
    Task<List<SystemNotificationDto>> GetNotificationsAsync(CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(string id, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(CancellationToken cancellationToken = default);
}
