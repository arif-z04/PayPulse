using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.Common.Models;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Application.Services;

public class AuditService : IAuditService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AuditService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResponse<AuditLogDto>> GetAuditLogsAsync(AuditFilterParamsDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.SystemAuditLogs
            .Include(a => a.User)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.TableName))
        {
            query = query.Where(a => a.TableName == filter.TableName);
        }

        if (!string.IsNullOrWhiteSpace(filter.Operation))
        {
            query = query.Where(a => a.OperationType == filter.Operation);
        }

        if (!string.IsNullOrWhiteSpace(filter.UserName))
        {
            var u = filter.UserName.Trim().ToLower();
            query = query.Where(a => a.User != null && a.User.Username.ToLower().Contains(u));
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(a =>
                a.TableName.ToLower().Contains(q) ||
                a.Description.ToLower().Contains(q) ||
                a.RecordId.ToLower().Contains(q));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 10;

        var items = await query
            .OrderByDescending(a => a.LoggedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        return new PaginatedResponse<AuditLogDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<AuditLogDto> GetAuditLogByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var item = await _context.SystemAuditLogs
            .Include(a => a.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AuditId == id, cancellationToken);

        if (item == null) throw new NotFoundException("SystemAuditLog", id);
        return MapToDto(item);
    }

    public async Task LogAsync(string tableName, string operation, string recordId, object? oldValues, object? newValues, string description, CancellationToken cancellationToken = default)
    {
        var log = new SystemAuditLog
        {
            TableName = tableName,
            OperationType = operation,
            RecordId = recordId,
            UserId = _currentUserService.UserId,
            IpAddress = _currentUserService.IpAddress,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            Description = description,
            LoggedAt = DateTime.UtcNow
        };

        _context.SystemAuditLogs.Add(log);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static AuditLogDto MapToDto(SystemAuditLog a)
    {
        object? oldObj = null;
        if (!string.IsNullOrWhiteSpace(a.OldValues))
        {
            try { oldObj = JsonSerializer.Deserialize<object>(a.OldValues); } catch { oldObj = a.OldValues; }
        }

        object? newObj = null;
        if (!string.IsNullOrWhiteSpace(a.NewValues))
        {
            try { newObj = JsonSerializer.Deserialize<object>(a.NewValues); } catch { newObj = a.NewValues; }
        }

        return new AuditLogDto
        {
            Id = a.AuditId.ToString(),
            TableName = a.TableName,
            Operation = a.OperationType,
            RecordId = a.RecordId,
            UserId = a.UserId?.ToString() ?? "system",
            UserName = a.User?.Username ?? "System",
            UserRole = a.User?.Role ?? "System",
            Timestamp = a.LoggedAt.ToString("o"),
            IpAddress = a.IpAddress ?? "127.0.0.1",
            OldValues = oldObj,
            NewValues = newObj,
            Description = a.Description
        };
    }
}
