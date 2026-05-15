using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Mulkchi.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
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
            _logger.LogError(
                ex,
                "Unhandled exception for {Method} {Path}. TraceId: {TraceId}, UserId: {UserId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier,
                context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous");

            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.Clear();
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = GetStatusCode(exception);

        var response = new
        {
            error = new
            {
                code = GetErrorCode(exception),
                message = GetErrorMessage(exception),
                traceId = context.TraceIdentifier
            }
        };

        var jsonResponse = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(jsonResponse);
    }

    private static int GetStatusCode(Exception exception)
    {
        var innermostException = GetInnermostException(exception);
        var typeName = exception.GetType().Name;
        var innermostTypeName = innermostException.GetType().Name;

        return exception switch
        {
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            ArgumentException => StatusCodes.Status400BadRequest,
            InvalidOperationException => StatusCodes.Status400BadRequest,
            _ when innermostException is UnauthorizedAccessException =>
                StatusCodes.Status401Unauthorized,
            _ when innermostException is KeyNotFoundException ||
                   innermostTypeName.StartsWith("NotFound", StringComparison.Ordinal) =>
                StatusCodes.Status404NotFound,
            _ when innermostTypeName.StartsWith("AlreadyExists", StringComparison.Ordinal) =>
                StatusCodes.Status409Conflict,
            _ when innermostTypeName.StartsWith("Invalid", StringComparison.Ordinal) ||
                   typeName.EndsWith("ValidationException", StringComparison.Ordinal) ||
                   typeName.EndsWith("DependencyValidationException", StringComparison.Ordinal) =>
                StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };
    }

    private static string GetErrorCode(Exception exception) =>
        ToErrorCode(GetInnermostException(exception).GetType().Name);

    private static string GetErrorMessage(Exception exception)
    {
        var statusCode = GetStatusCode(exception);
        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            return "So'rov bajarilmadi.";
        }

        // If it's a validation error or specific auth error, return the actual message
        var innermostException = GetInnermostException(exception);
        if (exception.GetType().Name.EndsWith("ValidationException") || 
            innermostException.GetType().Name.StartsWith("Invalid"))
        {
            return innermostException.Message;
        }

        return GetSafeErrorMessage(statusCode);
    }

    private static string GetSafeErrorMessage(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest => "So'rov noto'g'ri.",
        StatusCodes.Status401Unauthorized => "Avtorizatsiya talab qilinadi.",
        StatusCodes.Status403Forbidden => "Kirishga ruxsat yoq.",
        StatusCodes.Status404NotFound => "Topilmadi.",
        StatusCodes.Status409Conflict => "Ma'lumot bajarilmagan.",
        _ => "So'rov bajarilmadi."
    };

    private static string? GetExceptionDetails(Exception exception)
    {
        var statusCode = GetStatusCode(exception);
        // Never expose exception details to client
        return null;
    }

    private static Exception GetInnermostException(Exception exception)
    {
        while (exception.InnerException is not null)
        {
            exception = exception.InnerException;
        }

        return exception;
    }

    private static string ToErrorCode(string exceptionTypeName)
    {
        var trimmedName = exceptionTypeName.EndsWith("Exception", StringComparison.Ordinal)
            ? exceptionTypeName[..^"Exception".Length]
            : exceptionTypeName;

        var builder = new System.Text.StringBuilder();
        for (var index = 0; index < trimmedName.Length; index++)
        {
            var character = trimmedName[index];
            if (index > 0 && char.IsUpper(character) && !char.IsUpper(trimmedName[index - 1]))
            {
                builder.Append('_');
            }

            builder.Append(char.ToUpperInvariant(character));
        }

        return builder.ToString();
    }
}
