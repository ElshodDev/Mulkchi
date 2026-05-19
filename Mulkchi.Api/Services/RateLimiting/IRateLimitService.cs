namespace Mulkchi.Api.Services.RateLimiting;

/// <summary>
/// Abstraction for sliding-window rate limiting.
/// The default implementation (<see cref="InMemoryRateLimitService"/>) uses
/// in-process ConcurrentDictionary + SemaphoreSlim.
/// Swap in a Redis-backed implementation to support multiple API pods.
/// </summary>
public interface IRateLimitService
{
    /// <summary>
    /// Records a request attempt and returns <c>true</c> when the caller has
    /// exceeded the allowed number of requests within the sliding window.
    /// </summary>
    /// <param name="key">Unique bucket key (e.g. IP address + endpoint category).</param>
    /// <param name="windowSeconds">Length of the sliding window in seconds.</param>
    /// <param name="maxRequests">Maximum allowed requests within the window.</param>
    Task<bool> IsRateLimitedAsync(string key, int windowSeconds, int maxRequests);
}
