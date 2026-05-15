using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Mulkchi.Api.Brokers.DateTimes;

namespace Mulkchi.Api.Services.RateLimiting;

/// <summary>
/// Distributed rate limiter backed by IDistributedCache (Redis).
/// Implements a fixed-window counter approach which is suitable for distributed scale-out.
/// </summary>
public class DistributedRateLimitService : IRateLimitService
{
    private readonly IDistributedCache _distributedCache;
    private readonly IDateTimeBroker _dateTimeBroker;

    public DistributedRateLimitService(IDistributedCache distributedCache, IDateTimeBroker dateTimeBroker)
    {
        _distributedCache = distributedCache;
        _dateTimeBroker = dateTimeBroker;
    }

    public async Task<bool> IsRateLimitedAsync(string key, int windowSeconds, int maxRequests)
    {
        // Compute fixed window key based on current time
        var now = _dateTimeBroker.GetCurrentDateTimeOffset().ToUnixTimeSeconds();
        var windowStart = now / windowSeconds; // Integer division creates fixed time buckets
        
        var cacheKey = $"rate_limit:{key}:{windowStart}";

        // Attempt to increment the counter
        // Note: IDistributedCache doesn't have an atomic IncrementAsync.
        // For strict exact rate limiting, IConnectionMultiplexer + Lua is better,
        // but this approximation works well for most use cases using IDistributedCache.
        
        string? currentCountStr = await _distributedCache.GetStringAsync(cacheKey);
        int currentCount = string.IsNullOrEmpty(currentCountStr) ? 0 : int.Parse(currentCountStr);

        if (currentCount >= maxRequests)
        {
            return true;
        }

        currentCount++;
        
        await _distributedCache.SetStringAsync(cacheKey, currentCount.ToString(), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = System.TimeSpan.FromSeconds(windowSeconds * 2) // keep slightly longer than window
        });

        return false;
    }
}
