using System.Collections.Concurrent;

namespace Mulkchi.Api.Services.RateLimiting;

/// <summary>
/// Single-process sliding-window rate limiter backed by in-memory data structures.
/// Works correctly for a single API instance. To support scale-out, replace this
/// registration in <c>Startup.cs</c> with a Redis-backed implementation that
/// implements <see cref="IRateLimitService"/>.
/// </summary>
public class InMemoryRateLimitService : IRateLimitService
{
    // Per-key request timestamps (Unix seconds)
    private readonly ConcurrentDictionary<string, Queue<long>> _store = new();

    // Per-key semaphore to make sliding-window mutation thread-safe
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public async Task<bool> IsRateLimitedAsync(string key, int windowSeconds, int maxRequests)
    {
        var semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();
        try
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var windowStart = now - windowSeconds;

            var queue = _store.GetOrAdd(key, _ => new Queue<long>());

            // Evict timestamps outside the current window
            while (queue.Count > 0 && queue.Peek() < windowStart)
                queue.Dequeue();

            if (queue.Count >= maxRequests)
                return true;

            queue.Enqueue(now);
            return false;
        }
        finally
        {
            semaphore.Release();
        }
    }
}
