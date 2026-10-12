using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace PayPulse.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "ConnectionStrings:DefaultConnection", "Server=127.0.0.1;Port=3308;Database=paypulse_db;User=paypulse_user;Password=PayPulseUser@2026!;CharSet=utf8mb4;" },
                { "Jwt:SecretKey", "PayPulse_SuperSecretEnterpriseKey_2026!#SecureAuthTokenKeyMustBeLongEnough" },
                { "Jwt:Issuer", "PayPulse" },
                { "Jwt:Audience", "PayPulseApp" }
            });
        });
    }
}
