using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using PayPulse.Application.Common.Models;
using PayPulse.Domain.Exceptions;

namespace PayPulse.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "An internal server error occurred.";
        IDictionary<string, string[]>? errors = null;

        switch (exception)
        {
            case NotFoundException notFound:
                statusCode = HttpStatusCode.NotFound;
                message = notFound.Message;
                break;

            case BusinessRuleException businessRule:
                statusCode = HttpStatusCode.BadRequest;
                message = businessRule.Message;
                break;

            case DuplicateEntityException duplicate:
                statusCode = HttpStatusCode.Conflict;
                message = duplicate.Message;
                break;

            case UnauthorizedException unauthorized:
                statusCode = HttpStatusCode.Unauthorized;
                message = unauthorized.Message;
                break;

            case ForbiddenException forbidden:
                statusCode = HttpStatusCode.Forbidden;
                message = forbidden.Message;
                break;

            default:
                _logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);
                message = exception.Message;
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.Fail(message, errors);
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
