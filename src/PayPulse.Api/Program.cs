using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using PayPulse.Api.Middleware;
using PayPulse.Api.Services;
using PayPulse.Application;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Infrastructure & Application Services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// 2. Add HTTP Context & Current User Service
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// 3. Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 4. JWT Authentication
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "PayPulse_SuperSecretEnterpriseKey_2026!#SecureAuthTokenKeyMustBeLongEnough";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PayPulse";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PayPulseApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 5. CORS Configuration
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
[
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
];

builder.Services.AddCors(options =>
{
    options.AddPolicy("PayPulseCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 6. Swagger / OpenAPI Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PayPulse Enterprise API",
        Version = "v1",
        Description = "Enterprise Payroll, Attendance and Leave Management REST API built with ASP.NET Core & Entity Framework Core.",
        Contact = new OpenApiContact
        {
            Name = "PayPulse Engineering Team",
            Email = "support@paypulse.internal"
        }
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    };

    c.AddSecurityDefinition("Bearer", securityScheme);

    var requirement = new OpenApiSecurityRequirement();
    requirement.Add(new OpenApiSecuritySchemeReference("Bearer"), new List<string>());
    c.AddSecurityRequirement(_ => requirement);
});

// 7. Health Checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure Middleware Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PayPulse API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("PayPulseCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

// For integration tests
public partial class Program { }
