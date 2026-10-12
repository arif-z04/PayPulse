using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;

namespace PayPulse.Application.Services;

public class ReportService : IReportService
{
    private readonly IAppDbContext _context;

    public ReportService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DepartmentPayrollCostDto>> GetDepartmentPayrollCostAsync(string period, CancellationToken cancellationToken = default)
    {
        int year = 2026, month = 9;
        if (!string.IsNullOrWhiteSpace(period))
        {
            var parts = period.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[0], out var y) && int.TryParse(parts[1], out var m))
            {
                year = y;
                month = m;
            }
        }

        var departments = await _context.Departments
            .Include(d => d.Employees)
                .ThenInclude(e => e.MonthlyPayrolls.Where(p => p.PayrollYear == year && p.PayrollMonth == month))
            .Where(d => d.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return departments.Select(d =>
        {
            var payrolls = d.Employees.SelectMany(e => e.MonthlyPayrolls).ToList();
            var headCount = d.Employees.Count(e => e.EmploymentStatus == "Active");

            var gross = payrolls.Sum(p => p.GrossSalary);
            var allowances = payrolls.Sum(p => p.TotalAllowances);
            var deductions = payrolls.Sum(p => p.TotalDeductions);
            var net = payrolls.Sum(p => p.NetSalary);

            return new DepartmentPayrollCostDto
            {
                DepartmentId = d.DepartmentId.ToString(),
                DepartmentName = d.DepartmentName,
                HeadCount = headCount > 0 ? headCount : payrolls.Count,
                GrossPayroll = gross,
                Allowances = allowances,
                Deductions = deductions,
                NetPayroll = net
            };
        }).ToList();
    }

    public async Task<List<AttendanceAnalyticsDto>> GetAttendanceTrendAsync(CancellationToken cancellationToken = default)
    {
        var recentDates = await _context.AttendanceLogs
            .Select(a => a.WorkDate)
            .Distinct()
            .OrderByDescending(d => d)
            .Take(7)
            .ToListAsync(cancellationToken);

        recentDates = recentDates.OrderBy(d => d).ToList();

        var result = new List<AttendanceAnalyticsDto>();
        foreach (var date in recentDates)
        {
            var logs = await _context.AttendanceLogs
                .Where(a => a.WorkDate == date)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            result.Add(new AttendanceAnalyticsDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Present = logs.Count(l => l.AttendanceStatus == "Present"),
                Late = logs.Count(l => l.AttendanceStatus == "Late"),
                HalfDay = logs.Count(l => l.AttendanceStatus == "Half-Day"),
                Absent = logs.Count(l => l.AttendanceStatus == "Absent")
            });
        }

        return result;
    }

    public async Task<List<LeaveUtilizationDto>> GetLeaveUtilizationAsync(CancellationToken cancellationToken = default)
    {
        var currentYear = DateTime.UtcNow.Year;
        var departments = await _context.Departments
            .Include(d => d.Employees)
                .ThenInclude(e => e.LeaveAllocations.Where(a => a.CalendarYear == currentYear))
                    .ThenInclude(a => a.LeaveType)
            .Where(d => d.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return departments.Select(d =>
        {
            var allocations = d.Employees.SelectMany(e => e.LeaveAllocations).ToList();

            var casualUsed = allocations.Where(a => a.LeaveType.TypeName == "Casual").Sum(a => a.DaysUsed);
            var medicalUsed = allocations.Where(a => a.LeaveType.TypeName == "Medical").Sum(a => a.DaysUsed);
            var earnedUsed = allocations.Where(a => a.LeaveType.TypeName == "Earned").Sum(a => a.DaysUsed);

            var totalAllocated = allocations.Sum(a => a.TotalAllocatedDays);
            var totalUsed = allocations.Sum(a => a.DaysUsed);
            var rate = totalAllocated > 0 ? Math.Round(((decimal)totalUsed / totalAllocated) * 100m, 1) : 0m;

            return new LeaveUtilizationDto
            {
                DepartmentName = d.DepartmentName,
                CasualUsed = casualUsed,
                MedicalUsed = medicalUsed,
                EarnedUsed = earnedUsed,
                TotalAllocated = totalAllocated,
                TotalUsed = totalUsed,
                UtilizationRate = rate
            };
        }).ToList();
    }

    public async Task<TaxProvidentSummaryDto> GetTaxProvidentSummaryAsync(string period, CancellationToken cancellationToken = default)
    {
        int year = 2026, month = 9;
        if (!string.IsNullOrWhiteSpace(period))
        {
            var parts = period.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[0], out var y) && int.TryParse(parts[1], out var m))
            {
                year = y;
                month = m;
            }
        }

        var payrolls = await _context.MonthlyPayrolls
            .Where(p => p.PayrollYear == year && p.PayrollMonth == month)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var grossTotal = payrolls.Sum(p => p.GrossSalary);
        var taxTotal = payrolls.Sum(p => p.TaxDeducted);
        var pfEmployeeTotal = payrolls.Sum(p => p.ProvidentFundDeducted);
        var pfEmployerTotal = pfEmployeeTotal; // statutory matching 1:1

        return new TaxProvidentSummaryDto
        {
            Period = $"{year}-{month:D2}",
            GrossSalaryTotal = grossTotal,
            TaxWithheldTotal = taxTotal,
            ProvidentFundEmployeeTotal = pfEmployeeTotal,
            ProvidentFundEmployerTotal = pfEmployerTotal,
            TotalStatutoryDeposit = taxTotal + pfEmployeeTotal + pfEmployerTotal
        };
    }

    public async Task<List<SalaryBandComplianceDto>> GetSalaryBandComplianceAsync(CancellationToken cancellationToken = default)
    {
        var designations = await _context.Designations
            .Include(d => d.Department)
            .Include(d => d.Employees)
                .ThenInclude(e => e.SalaryStructures.Where(s => s.IsActive))
            .Where(d => d.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return designations.Select(d =>
        {
            var salaries = d.Employees
                .SelectMany(e => e.SalaryStructures)
                .Select(s => s.BasicSalary)
                .ToList();

            var count = salaries.Count;
            var actualMin = count > 0 ? salaries.Min() : d.MinSalary;
            var actualMax = count > 0 ? salaries.Max() : d.MaxSalary;
            var actualAvg = count > 0 ? Math.Round(salaries.Average(), 2) : Math.Round((d.MinSalary + d.MaxSalary) / 2m, 2);
            var compliant = salaries.Count(s => s >= d.MinSalary && s <= d.MaxSalary);

            return new SalaryBandComplianceDto
            {
                DesignationId = d.DesignationId.ToString(),
                DesignationTitle = d.DesignationTitle,
                DepartmentName = d.Department.DepartmentName,
                MinAllowed = d.MinSalary,
                MaxAllowed = d.MaxSalary,
                ActualMin = actualMin,
                ActualMax = actualMax,
                ActualAvg = actualAvg,
                CompliantCount = compliant,
                TotalEmployees = count,
                IsCompliant = compliant == count
            };
        }).ToList();
    }
}
