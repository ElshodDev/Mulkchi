using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Mulkchi.Api.Services.RateLimiting;

namespace Mulkchi.Api.Middleware;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IRateLimitService _rateLimitService;
    private readonly bool _isEnabled;
    private readonly HashSet<string> _trustedProxies;

    private readonly int _authMaxRequests;
    private readonly int _uploadMaxRequests;
    private readonly int _generalMaxRequests;
    private readonly int _windowSeconds;

    public RateLimitMiddleware(
        RequestDelegate next,
        IRateLimitService rateLimitService,
        IConfiguration configuration)
    {
        _next = next;
        _rateLimitService = rateLimitService;
        _isEnabled = configuration.GetValue<bool>("RateLimiting:Enabled", true);

        _authMaxRequests = configuration.GetValue<int>("RateLimiting:Auth", 20);
        _uploadMaxRequests = configuration.GetValue<int>("RateLimiting:Upload", 30);
        _generalMaxRequests = configuration.GetValue<int>("RateLimiting:General", 300);
        _windowSeconds = configuration.GetValue<int>("RateLimiting:WindowSeconds", 60);

        var proxies = configuration.GetSection("RateLimiting:TrustedProxies").Get<string[]>();
        _trustedProxies = proxies is { Length: > 0 }
            ? new HashSet<string>(proxies)
            : new HashSet<string>();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);
        return;

#if false
        var clientIp = GetClientIp(context);
        var path = context.Request.Path.Value?.ToLower() ?? "";

        if (path.StartsWith("/api/auth/"))
        {
            if (await _rateLimitService.IsRateLimitedAsync(
                    $"auth:{clientIp}", _windowSeconds, _authMaxRequests))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.Headers["Retry-After"] = _windowSeconds.ToString();
                await context.Response.WriteAsync("Too many authentication attempts. Please try again later.");
                return;
            }
        }
        else if (path.StartsWith("/api/propertyimagesupload/upload"))
        {
            if (await _rateLimitService.IsRateLimitedAsync(
                    $"upload:{clientIp}", _windowSeconds, _uploadMaxRequests))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.Headers["Retry-After"] = _windowSeconds.ToString();
                await context.Response.WriteAsync("Too many upload requests. Please try again later.");
                return;
            }
        }
        else
        {
            if (await _rateLimitService.IsRateLimitedAsync(
                    $"general:{clientIp}", _windowSeconds, _generalMaxRequests))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.Headers["Retry-After"] = _windowSeconds.ToString();
                await context.Response.WriteAsync("Too many requests. Please slow down.");
                return;
            }
        }

        await _next(context);
#endif
    }

    private string GetClientIp(HttpContext context)
    {
        var remoteIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (_trustedProxies.Contains(remoteIp))
        {
            var xForwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
            if (!string.IsNullOrEmpty(xForwardedFor))
                return xForwardedFor.Split(',')[0].Trim();

            var xRealIp = context.Request.Headers["X-Real-IP"].ToString();
            if (!string.IsNullOrEmpty(xRealIp))
                return xRealIp;
        }

        return remoteIp;
    }
}
