using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Mulkchi.Api.Middleware;

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

        headers["X-Frame-Options"] = "DENY";

        headers["X-Content-Type-Options"] = "nosniff";

        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob: https:; " +
            "font-src 'self'; " +
            "connect-src 'self' wss:; " +
            "frame-ancestors 'none';";

        headers["Permissions-Policy"] =
            "camera=(), microphone=(self), geolocation=(self), payment=(self)";

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
