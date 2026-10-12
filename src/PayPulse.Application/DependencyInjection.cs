using Microsoft.Extensions.DependencyInjection;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Services;

namespace PayPulse.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IDesignationService, DesignationService>();
        services.AddScoped<ISalaryService, SalaryService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<ILeaveService, LeaveService>();
        services.AddScoped<IPayrollService, PayrollService>();
        services.AddScoped<IDisbursementService, DisbursementService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<INotificationService, NotificationService>();

        return services;
    }
}
