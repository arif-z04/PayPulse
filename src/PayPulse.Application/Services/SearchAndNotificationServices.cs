using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;

namespace PayPulse.Application.Services;

public class SearchService : ISearchService
{
    private readonly IAppDbContext _context;

    public SearchService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GlobalSearchResultDto>> SearchGlobalAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            return new List<GlobalSearchResultDto>();

        var q = query.Trim().ToLower();
        var results = new List<GlobalSearchResultDto>();

        // Search Employees
        var employees = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Where(e => e.FirstName.ToLower().Contains(q) ||
                        e.LastName.ToLower().Contains(q) ||
                        e.EmployeeCode.ToLower().Contains(q) ||
                        e.OfficialEmail.ToLower().Contains(q))
            .Take(4)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        foreach (var emp in employees)
        {
            results.Add(new GlobalSearchResultDto
            {
                Type = "employee",
                Title = emp.FullName,
                Subtitle = $"{emp.EmployeeCode} • {emp.Designation?.DesignationTitle} ({emp.Department?.DepartmentName})",
                Url = $"/employees/{emp.EmployeeId}"
            });
        }

        // Search Departments
        var departments = await _context.Departments
            .Include(d => d.Employees)
            .Where(d => d.DepartmentName.ToLower().Contains(q) || d.DepartmentCode.ToLower().Contains(q))
            .Take(3)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        foreach (var d in departments)
        {
            results.Add(new GlobalSearchResultDto
            {
                Type = "department",
                Title = d.DepartmentName,
                Subtitle = $"Code: {d.DepartmentCode} • {d.Employees.Count} team members",
                Url = $"/departments/{d.DepartmentId}"
            });
        }

        // Search Payroll
        var payrolls = await _context.MonthlyPayrolls
            .Include(p => p.Employee)
            .Where(p => p.Employee.FirstName.ToLower().Contains(q) ||
                        p.Employee.LastName.ToLower().Contains(q) ||
                        p.PayrollYear.ToString().Contains(q))
            .Take(3)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        foreach (var p in payrolls)
        {
            results.Add(new GlobalSearchResultDto
            {
                Type = "payroll",
                Title = $"Payroll {p.PayrollYear}-{p.PayrollMonth:D2} - {p.Employee.FullName}",
                Subtitle = $"Net: ৳{p.NetSalary:N2} • Status: {p.PayrollStatus}",
                Url = $"/payroll/{p.PayrollId}"
            });
        }

        // Reports matching
        if ("payroll cost tax attendance leave compliance".Contains(q))
        {
            results.Add(new GlobalSearchResultDto
            {
                Type = "report",
                Title = "Departmental Payroll Cost Report",
                Subtitle = "Analytics & Financial statements",
                Url = "/reports/payroll"
            });
        }

        return results.Take(8).ToList();
    }
}

public class NotificationService : INotificationService
{
    private static readonly List<SystemNotificationDto> _notifications = new()
    {
        new SystemNotificationDto
        {
            Id = "notif-1",
            Title = "Monthly Payroll Ready for Review",
            Message = "September 2026 payroll batch has been processed in Draft state and awaits approval.",
            Category = "payroll",
            IsRead = false,
            CreatedAt = DateTime.UtcNow.AddHours(-2).ToString("o"),
            Link = "/payroll"
        },
        new SystemNotificationDto
        {
            Id = "notif-2",
            Title = "Pending Leave Applications",
            Message = "You have 3 direct report leave applications pending managerial approval.",
            Category = "leave",
            IsRead = false,
            CreatedAt = DateTime.UtcNow.AddHours(-5).ToString("o"),
            Link = "/leave"
        },
        new SystemNotificationDto
        {
            Id = "notif-3",
            Title = "Attendance Logs Synchronized",
            Message = "Biometric clock-in records synchronized for today's morning shift.",
            Category = "attendance",
            IsRead = true,
            CreatedAt = DateTime.UtcNow.AddHours(-10).ToString("o"),
            Link = "/attendance"
        }
    };

    public Task<List<SystemNotificationDto>> GetNotificationsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_notifications.OrderByDescending(n => n.CreatedAt).ToList());
    }

    public Task MarkAsReadAsync(string id, CancellationToken cancellationToken = default)
    {
        var item = _notifications.FirstOrDefault(n => n.Id == id);
        if (item != null) item.IsRead = true;
        return Task.CompletedTask;
    }

    public Task MarkAllAsReadAsync(CancellationToken cancellationToken = default)
    {
        foreach (var item in _notifications)
        {
            item.IsRead = true;
        }
        return Task.CompletedTask;
    }
}
