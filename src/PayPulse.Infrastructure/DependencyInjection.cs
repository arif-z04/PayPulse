using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Infrastructure.Persistence;
using PayPulse.Infrastructure.Services;

namespace PayPulse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=127.0.0.1;Port=3308;Database=paypulse_db;User=paypulse_user;Password=PayPulseUser@2026!;CharSet=utf8mb4;";

        var serverVersion = new MySqlServerVersion(new Version(8, 4, 0));

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseMySql(connectionString, serverVersion, mySqlOptions =>
            {
                mySqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorNumbersToAdd: null);
            });
        });

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
