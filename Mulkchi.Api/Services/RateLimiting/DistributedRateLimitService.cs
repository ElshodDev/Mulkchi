using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Mulkchi.Api.Brokers.DateTimes;

namespace Mulkchi.Api.Services.RateLimiting;

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
        var now = _dateTimeBroker.GetCurrentDateTimeOffset().ToUnixTimeSeconds();
        var windowStart = now / windowSeconds;

        var cacheKey = $"rate_limit:{key}:{windowStart}";


        string? currentCountStr = await _distributedCache.GetStringAsync(cacheKey);
        int currentCount = string.IsNullOrEmpty(currentCountStr) ? 0 : int.Parse(currentCountStr);

        if (currentCount >= maxRequests)
        {
            return true;
        }

        currentCount++;

        await _distributedCache.SetStringAsync(cacheKey, currentCount.ToString(), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = System.TimeSpan.FromSeconds(windowSeconds * 2)
        });

        return false;
    }
}
