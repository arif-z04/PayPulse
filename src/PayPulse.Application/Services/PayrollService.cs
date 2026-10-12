using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Extensions;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class PayrollService : IPayrollService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public PayrollService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResponse<PayrollDto>> GetPayrollsAsync(PayrollFilterParamsDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.MonthlyPayrolls
            .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
            .Include(p => p.Employee)
                .ThenInclude(e => e.Designation)
            .Include(p => p.Components)
            .Include(p => p.Disbursement)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Period))
        {
            var parts = filter.Period.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[0], out var y) && int.TryParse(parts[1], out var m))
            {
                query = query.Where(p => p.PayrollYear == y && p.PayrollMonth == m);
            }
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            var status = filter.Status;
            if (status == "Approved") status = "Finalized"; // normalize frontend alias
            query = query.Where(p => p.PayrollStatus == status || (status == "Finalized" && p.PayrollStatus == "Approved"));
        }

        if (!string.IsNullOrWhiteSpace(filter.DepartmentName))
        {
            query = query.Where(p => p.Employee.Department.DepartmentName == filter.DepartmentName);
        }

        if (!string.IsNullOrWhiteSpace(filter.EmployeeId) && int.TryParse(filter.EmployeeId, out var empId))
        {
            query = query.Where(p => p.EmployeeId == empId);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Employee.FirstName.ToLower().Contains(q) ||
                p.Employee.LastName.ToLower().Contains(q) ||
                p.Employee.EmployeeCode.ToLower().Contains(q) ||
                p.Employee.Department.DepartmentName.ToLower().Contains(q));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 10;

        var items = await query
            .OrderByDescending(p => p.PayrollYear)
            .ThenByDescending(p => p.PayrollMonth)
            .ThenBy(p => p.EmployeeId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedResponse<PayrollDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<PayrollDto> GetPayrollByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var p = await _context.MonthlyPayrolls
            .Include(p => p.Employee)
                .ThenInclude(e => e.Department)
            .Include(p => p.Employee)
                .ThenInclude(e => e.Designation)
            .Include(p => p.Components)
            .Include(p => p.Disbursement)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PayrollId == id, cancellationToken);

        if (p == null) throw new NotFoundException("MonthlyPayroll", id);
        return MapToDto(p);
    }

    public async Task<ProcessPayrollResultDto> ProcessMonthlyPayrollBatchAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        if (month < 1 || month > 12)
            throw new BusinessRuleException("Payroll month must be between 1 and 12.");

        if (year < 2020 || year > 2035)
            throw new BusinessRuleException("Payroll year is outside valid operational bounds.");

        // Idempotency & concurrency check
        var hasLockedRecords = await _context.MonthlyPayrolls
            .AnyAsync(p => p.PayrollYear == year && p.PayrollMonth == month &&
                          (p.PayrollStatus == "Finalized" || p.PayrollStatus == "Disbursed" || p.PayrollStatus == "Approved"),
                      cancellationToken);

        if (hasLockedRecords)
        {
            throw new BusinessRuleException($"Cannot regenerate: Payroll for period {year}-{month:D2} is already Finalized or Disbursed.");
        }

        return await _context.ExecuteInTransactionAsync(async () =>
        {
            // Remove existing draft payrolls for this period if any
            var existingDrafts = await _context.MonthlyPayrolls
                .Where(p => p.PayrollYear == year && p.PayrollMonth == month && p.PayrollStatus == "Draft")
                .ToListAsync(cancellationToken);

            if (existingDrafts.Count > 0)
            {
                _context.MonthlyPayrolls.RemoveRange(existingDrafts);
                await _context.SaveChangesAsync(cancellationToken);
            }

            var activeEmployees = await _context.Employees
                .Include(e => e.SalaryStructures.Where(s => s.IsActive))
                .Where(e => e.EmploymentStatus == "Active")
                .ToListAsync(cancellationToken);

            var startDate = new DateOnly(year, month, 1);
            var daysInMonth = DateTime.DaysInMonth(year, month);
            var endDate = new DateOnly(year, month, daysInMonth);

            int workingDays = 26; // Standard 26 working days in corporate month
            int processedCount = 0;
            decimal totalGross = 0m;
            decimal totalNet = 0m;

            var processorUserId = _currentUserService.UserId ?? 1;

            foreach (var emp in activeEmployees)
            {
                var salary = emp.SalaryStructures.FirstOrDefault();
                if (salary == null) continue; // Skip employee without compensation structure

                // Calculate attendance
                var attendance = await _context.AttendanceLogs
                    .Where(a => a.EmployeeId == emp.EmployeeId && a.WorkDate >= startDate && a.WorkDate <= endDate)
                    .ToListAsync(cancellationToken);

                var presentDays = attendance.Count(a => a.AttendanceStatus == "Present" || a.AttendanceStatus == "Late" || a.AttendanceStatus == "Half-Day");
                var totalOtHours = attendance.Sum(a => a.OvertimeHours);

                // Calculate leaves
                var approvedLeaves = await _context.LeaveRequests
                    .Include(r => r.LeaveType)
                    .Where(r => r.EmployeeId == emp.EmployeeId &&
                                r.ApplicationStatus == "Approved" &&
                                r.StartDate <= endDate && r.EndDate >= startDate)
                    .ToListAsync(cancellationToken);

                var paidLeaveDays = approvedLeaves.Where(r => r.LeaveType.IsPaid).Sum(r => r.TotalDaysRequested);
                var unpaidLeaveDays = approvedLeaves.Where(r => !r.LeaveType.IsPaid).Sum(r => r.TotalDaysRequested);

                var basic = salary.BasicSalary;
                var allowances = salary.HouseRentAllowance + salary.MedicalAllowance + salary.ConveyanceAllowance + salary.SpecialAllowance;
                var gross = basic + allowances;

                // Statutory Deductions
                var tax = Math.Round((gross * salary.TaxDeductionRate) / 100m, 2, MidpointRounding.AwayFromZero);
                var pf = Math.Round((gross * salary.ProvidentFundRate) / 100m, 2, MidpointRounding.AwayFromZero);
                var unpaidLeaveDeduction = unpaidLeaveDays > 0 ? Math.Round((basic / 26m) * unpaidLeaveDays, 2, MidpointRounding.AwayFromZero) : 0m;

                var totalDeductions = tax + pf + unpaidLeaveDeduction;

                // Overtime: standard 1.5x hourly rate based on 208 hrs/month
                var otPay = totalOtHours > 0 ? Math.Round(totalOtHours * (basic / 208m) * 1.5m, 2, MidpointRounding.AwayFromZero) : 0m;

                var net = gross - totalDeductions + otPay;

                var payroll = new MonthlyPayroll
                {
                    EmployeeId = emp.EmployeeId,
                    PayrollYear = year,
                    PayrollMonth = month,
                    WorkingDaysInMonth = workingDays,
                    PresentDays = presentDays > 0 ? presentDays : workingDays,
                    PaidLeaveDays = paidLeaveDays,
                    UnpaidLeaveDays = unpaidLeaveDays,
                    BasicSalarySnapshot = basic,
                    TotalAllowances = allowances,
                    GrossSalary = gross,
                    TotalDeductions = totalDeductions,
                    TaxDeducted = tax,
                    ProvidentFundDeducted = pf,
                    OvertimePay = otPay,
                    NetSalary = net,
                    PayrollStatus = "Draft",
                    ProcessedByUserId = processorUserId,
                    ProcessedDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Add itemized component details
                payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Basic Salary", ComponentType = "Earning", Amount = basic, IsTaxable = true });
                if (salary.HouseRentAllowance > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "House Rent Allowance", ComponentType = "Earning", Amount = salary.HouseRentAllowance, IsTaxable = true });
                if (salary.MedicalAllowance > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Medical Allowance", ComponentType = "Earning", Amount = salary.MedicalAllowance, IsTaxable = false });
                if (salary.ConveyanceAllowance > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Conveyance Allowance", ComponentType = "Earning", Amount = salary.ConveyanceAllowance, IsTaxable = false });
                if (salary.SpecialAllowance > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Special Allowance", ComponentType = "Earning", Amount = salary.SpecialAllowance, IsTaxable = true });
                if (otPay > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Overtime Earnings", ComponentType = "Earning", Amount = otPay, IsTaxable = true });

                if (tax > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Income Tax Withholding", ComponentType = "Deduction", Amount = tax, IsTaxable = false });
                if (pf > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Provident Fund (Employee)", ComponentType = "Deduction", Amount = pf, IsTaxable = false });
                if (unpaidLeaveDeduction > 0)
                    payroll.Components.Add(new PayrollComponentDetail { ComponentName = "Unpaid Leave Deduction", ComponentType = "Deduction", Amount = unpaidLeaveDeduction, IsTaxable = false });

                _context.MonthlyPayrolls.Add(payroll);

                processedCount++;
                totalGross += gross;
                totalNet += net;
            }

            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                TableName = "Monthly_Payroll",
                OperationType = "INSERT",
                RecordId = $"{year}-{month:D2}",
                UserId = _currentUserService.UserId,
                IpAddress = _currentUserService.IpAddress,
                Description = $"Generated draft payroll batch for period {year}-{month:D2}: {processedCount} vouchers, Gross: {totalGross} BDT, Net: {totalNet} BDT",
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);

            return new ProcessPayrollResultDto
            {
                Year = year,
                Month = month,
                ProcessedCount = processedCount,
                TotalGrossAmount = totalGross,
                TotalNetAmount = totalNet,
                Message = $"Successfully generated {processedCount} draft payroll records for period {year}-{month:D2}."
            };
        }, cancellationToken);
    }

    public async Task<PayrollDto> FinalizePayrollAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ExecuteInTransactionAsync(async () =>
        {
            var payroll = await _context.MonthlyPayrolls
                .Include(p => p.Employee)
                    .ThenInclude(e => e.Department)
                .Include(p => p.Employee)
                    .ThenInclude(e => e.Designation)
                .Include(p => p.Components)
                .Include(p => p.Disbursement)
                .FirstOrDefaultAsync(p => p.PayrollId == id, cancellationToken);

            if (payroll == null)
                throw new NotFoundException("MonthlyPayroll", id);

            if (payroll.PayrollStatus == "Disbursed")
                throw new BusinessRuleException("Cannot modify a disbursed payroll voucher.");

            var oldStatus = payroll.PayrollStatus;
            payroll.PayrollStatus = "Finalized";
            payroll.FinalizedDate = DateTime.UtcNow;
            payroll.UpdatedAt = DateTime.UtcNow;

            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                TableName = "Monthly_Payroll",
                OperationType = "UPDATE",
                RecordId = id.ToString(),
                UserId = _currentUserService.UserId,
                IpAddress = _currentUserService.IpAddress,
                OldValues = JsonSerializer.Serialize(new { status = oldStatus }),
                NewValues = JsonSerializer.Serialize(new { status = "Finalized" }),
                Description = $"Approved and finalized payroll voucher #{id} for {payroll.Employee.FullName} ({payroll.PayrollYear}-{payroll.PayrollMonth:D2})",
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);

            return MapToDto(payroll);
        }, cancellationToken);
    }

    public async Task<PayrollDto> DisbursePayrollAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.ExecuteInTransactionAsync(async () =>
            {
                var payroll = await _context.MonthlyPayrolls
                    .Include(p => p.Employee)
                        .ThenInclude(e => e.Department)
                    .Include(p => p.Employee)
                        .ThenInclude(e => e.Designation)
                    .Include(p => p.Components)
                    .Include(p => p.Disbursement)
                    .FirstOrDefaultAsync(p => p.PayrollId == id, cancellationToken);

                if (payroll == null)
                    throw new NotFoundException("MonthlyPayroll", id);

                if (payroll.PayrollStatus == "Disbursed" || payroll.Disbursement != null)
                    throw new BusinessRuleException($"Payroll voucher #{id} has already been disbursed.");

                var txnRef = $"TXN-{payroll.PayrollYear}{payroll.PayrollMonth:D2}-{Random.Shared.Next(1000, 9999)}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
                var maskedAccount = MaskAccountNumber(payroll.Employee.BankAccountNumber);

                var disbursement = new DisbursementRecord
                {
                    PayrollId = payroll.PayrollId,
                    TransactionReference = txnRef,
                    DisbursementDate = DateTime.UtcNow,
                    DisbursementMethod = "Bank Transfer (BEFTN)",
                    TargetBankName = payroll.Employee.BankName,
                    TargetAccountMasked = maskedAccount,
                    DisbursedAmount = payroll.NetSalary,
                    DisbursementStatus = "Disbursed",
                    AuthorizedByUserId = _currentUserService.UserId ?? 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                payroll.Disbursement = disbursement;
                payroll.PayrollStatus = "Disbursed";
                payroll.UpdatedAt = DateTime.UtcNow;

                _context.DisbursementRecords.Add(disbursement);

                _context.SystemAuditLogs.Add(new SystemAuditLog
                {
                    TableName = "Disbursement_Record",
                    OperationType = "INSERT",
                    RecordId = txnRef,
                    UserId = _currentUserService.UserId,
                    IpAddress = _currentUserService.IpAddress,
                    Description = $"Disbursed {payroll.NetSalary:N2} BDT to {payroll.Employee.FullName} via BEFTN (Ref: {txnRef})",
                    LoggedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync(cancellationToken);

                return MapToDto(payroll);
            }, cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException != null && (ex.InnerException.Message.Contains("Duplicate") || ex.InnerException.Message.Contains("1062")))
            {
                throw new BusinessRuleException($"A disbursement record already exists for payroll voucher #{id}. Duplicate disbursement prevented.");
            }
            throw;
        }
    }

    private static PayrollDto MapToDto(MonthlyPayroll p)
    {
        var period = $"{p.PayrollYear}-{p.PayrollMonth:D2}";
        var status = p.PayrollStatus == "Finalized" ? "Approved" : p.PayrollStatus;

        return new PayrollDto
        {
            Id = p.PayrollId.ToString(),
            PayrollPeriod = period,
            EmployeeId = p.EmployeeId.ToString(),
            EmployeeCode = p.Employee?.EmployeeCode ?? $"EMP-{p.EmployeeId}",
            EmployeeName = p.Employee?.FullName ?? $"Employee #{p.EmployeeId}",
            DepartmentName = p.Employee?.Department?.DepartmentName ?? "General",
            DesignationTitle = p.Employee?.Designation?.DesignationTitle ?? "Staff",
            BankAccountMasked = MaskAccountNumber(p.Employee?.BankAccountNumber ?? string.Empty),
            WorkingDays = p.WorkingDaysInMonth,
            PresentDays = p.PresentDays,
            PaidLeaveDays = p.PaidLeaveDays,
            UnpaidLeaveDays = p.UnpaidLeaveDays,
            BasicSalary = p.BasicSalarySnapshot,
            AllowancesTotal = p.TotalAllowances,
            GrossSalary = p.GrossSalary,
            DeductionsTotal = p.TotalDeductions,
            TaxDeducted = p.TaxDeducted,
            ProvidentFundDeducted = p.ProvidentFundDeducted,
            OvertimePay = p.OvertimePay,
            NetSalary = p.NetSalary,
            Status = status,
            ProcessedAt = p.ProcessedDate.ToString("o"),
            ApprovedAt = p.FinalizedDate?.ToString("o"),
            DisbursementReference = p.Disbursement?.TransactionReference,
            Components = p.Components.Select(c => new PayrollComponentDetailDto
            {
                Id = c.DetailId.ToString(),
                Name = c.ComponentName,
                Type = c.ComponentType,
                Amount = c.Amount,
                IsTaxable = c.IsTaxable
            }).ToList()
        };
    }

    private static string MaskAccountNumber(string account)
    {
        if (string.IsNullOrWhiteSpace(account) || account.Length <= 4)
            return "****";
        return new string('*', account.Length - 4) + account[^4..];
    }
}
