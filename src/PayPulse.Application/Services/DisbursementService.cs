using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class DisbursementService : IDisbursementService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DisbursementService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResponse<DisbursementDto>> GetDisbursementsAsync(DisbursementFilterParamsDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.DisbursementRecords
            .Include(d => d.MonthlyPayroll)
                .ThenInclude(p => p.Employee)
                    .ThenInclude(e => e.Department)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Period))
        {
            var parts = filter.Period.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[0], out var y) && int.TryParse(parts[1], out var m))
            {
                query = query.Where(d => d.MonthlyPayroll.PayrollYear == y && d.MonthlyPayroll.PayrollMonth == m);
            }
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(d => d.DisbursementStatus == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.PaymentMethod))
        {
            query = query.Where(d => d.DisbursementMethod == filter.PaymentMethod);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(d =>
                d.TransactionReference.ToLower().Contains(q) ||
                d.MonthlyPayroll.Employee.FirstName.ToLower().Contains(q) ||
                d.MonthlyPayroll.Employee.LastName.ToLower().Contains(q) ||
                d.TargetBankName.ToLower().Contains(q));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 10;

        var items = await query
            .OrderByDescending(d => d.DisbursementDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(d => new DisbursementDto
        {
            Id = d.DisbursementId.ToString(),
            PayrollId = d.PayrollId.ToString(),
            EmployeeId = d.MonthlyPayroll.EmployeeId.ToString(),
            EmployeeName = d.MonthlyPayroll.Employee?.FullName ?? $"Employee #{d.MonthlyPayroll.EmployeeId}",
            DepartmentName = d.MonthlyPayroll.Employee?.Department?.DepartmentName ?? "General",
            Amount = d.DisbursedAmount,
            Period = $"{d.MonthlyPayroll.PayrollYear}-{d.MonthlyPayroll.PayrollMonth:D2}",
            PaymentMethod = d.DisbursementMethod,
            BankName = d.TargetBankName,
            MaskedAccountNumber = d.TargetAccountMasked,
            TransactionReference = d.TransactionReference,
            DisbursementDate = d.DisbursementDate.ToString("o"),
            Status = d.DisbursementStatus == "Disbursed" ? "Successful" : d.DisbursementStatus,
            FailureReason = d.FailureReason
        }).ToList();

        return new PaginatedResponse<DisbursementDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<DisbursementDto> GetDisbursementByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var d = await _context.DisbursementRecords
            .Include(d => d.MonthlyPayroll)
                .ThenInclude(p => p.Employee)
                    .ThenInclude(e => e.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DisbursementId == id, cancellationToken);

        if (d == null) throw new NotFoundException("DisbursementRecord", id);

        return new DisbursementDto
        {
            Id = d.DisbursementId.ToString(),
            PayrollId = d.PayrollId.ToString(),
            EmployeeId = d.MonthlyPayroll.EmployeeId.ToString(),
            EmployeeName = d.MonthlyPayroll.Employee?.FullName ?? $"Employee #{d.MonthlyPayroll.EmployeeId}",
            DepartmentName = d.MonthlyPayroll.Employee?.Department?.DepartmentName ?? "General",
            Amount = d.DisbursedAmount,
            Period = $"{d.MonthlyPayroll.PayrollYear}-{d.MonthlyPayroll.PayrollMonth:D2}",
            PaymentMethod = d.DisbursementMethod,
            BankName = d.TargetBankName,
            MaskedAccountNumber = d.TargetAccountMasked,
            TransactionReference = d.TransactionReference,
            DisbursementDate = d.DisbursementDate.ToString("o"),
            Status = d.DisbursementStatus == "Disbursed" ? "Successful" : d.DisbursementStatus,
            FailureReason = d.FailureReason
        };
    }

    public async Task<DisbursementDto> RetryDisbursementAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var d = await _context.DisbursementRecords
                .Include(d => d.MonthlyPayroll)
                    .ThenInclude(p => p.Employee)
                        .ThenInclude(e => e.Department)
                .FirstOrDefaultAsync(d => d.DisbursementId == id, cancellationToken);

            if (d == null) throw new NotFoundException("DisbursementRecord", id);

            d.DisbursementStatus = "Disbursed";
            d.FailureReason = null;
            d.TransactionReference = $"TXN-RETRY-{Random.Shared.Next(1000, 9999)}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
            d.DisbursementDate = DateTime.UtcNow;
            d.UpdatedAt = DateTime.UtcNow;

            _context.SystemAuditLogs.Add(new Domain.Entities.SystemAuditLog
            {
                TableName = "Disbursement_Record",
                OperationType = "UPDATE",
                RecordId = d.TransactionReference,
                UserId = _currentUserService.UserId,
                IpAddress = _currentUserService.IpAddress,
                Description = $"Retried and settled disbursement #{id} for amount BDT {d.DisbursedAmount}",
                LoggedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return await GetDisbursementByIdAsync(id, cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
