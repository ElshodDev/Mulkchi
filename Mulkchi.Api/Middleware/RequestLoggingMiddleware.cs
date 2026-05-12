using System.Diagnostics;

namespace Mulkchi.Api.Middleware;

/// <summary>
/// Middleware for logging HTTP requests and responses
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestPath = context.Request.Path;
        var requestMethod = context.Request.Method;
        var correlationId = context.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString();

        _logger.LogInformation(
            "[{CorrelationId}] {RequestMethod} {RequestPath} - Request started",
            correlationId,
            requestMethod,
            requestPath);

        try
        {
            await _next(context);
            stopwatch.Stop();

            var statusCode = context.Response.StatusCode;
            var logLevel = statusCode >= 400 ? LogLevel.Warning : LogLevel.Information;

            _logger.Log(
                logLevel,
                "[{CorrelationId}] {RequestMethod} {RequestPath} - {StatusCode} - {ElapsedMs}ms",
                correlationId,
                requestMethod,
                requestPath,
                statusCode,
                stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(
                ex,
                "[{CorrelationId}] {RequestMethod} {RequestPath} - Error after {ElapsedMs}ms",
                correlationId,
                requestMethod,
                requestPath,
                stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}
