namespace Mulkchi.Api.Services.RateLimiting;

public interface IRateLimitService
{
    Task<bool> IsRateLimitedAsync(string key, int windowSeconds, int maxRequests);
}
