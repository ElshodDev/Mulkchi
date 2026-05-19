using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Mulkchi.Api.Middleware;

/// <summary>
/// Adds security-related HTTP response headers to every response.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Prevent the page from being embedded in an iframe (clickjacking protection)
        headers["X-Frame-Options"] = "DENY";

        // Prevent MIME-type sniffing
        headers["X-Content-Type-Options"] = "nosniff";

        // Control referrer information sent with requests
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Content Security Policy — restrictive baseline; tighten per environment as needed
        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob: https:; " +
            "font-src 'self'; " +
            "connect-src 'self' wss:; " +
            "frame-ancestors 'none';";

        // Permissions policy — disable unused browser features
        headers["Permissions-Policy"] =
            "camera=(), microphone=(), geolocation=(), payment=()";

        // HTTP Strict Transport Security (HSTS) — browsers must use HTTPS for 1 year.
        // Only set over HTTPS; do NOT set on plain HTTP responses.
        if (context.Request.IsHttps)
        {
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }

        await _next(context);
    }
}

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        => app.UseMiddleware<SecurityHeadersMiddleware>();
}
