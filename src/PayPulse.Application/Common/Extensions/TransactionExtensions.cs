using Microsoft.EntityFrameworkCore;
using PayPulse.Application.Common.Interfaces;

namespace PayPulse.Application.Common.Extensions;

public static class TransactionExtensions
{
    public static async Task ExecuteInTransactionAsync(
        this IAppDbContext context,
        Func<Task> action,
        CancellationToken cancellationToken = default)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await action();
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public static async Task<T> ExecuteInTransactionAsync<T>(
        this IAppDbContext context,
        Func<Task<T>> action,
        CancellationToken cancellationToken = default)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await action();
                await transaction.CommitAsync(cancellationToken);
                return result;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}
