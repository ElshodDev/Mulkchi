using System.Collections.Concurrent;

namespace Mulkchi.Api.Services.RateLimiting;

public class InMemoryRateLimitService : IRateLimitService
{
    private readonly ConcurrentDictionary<string, Queue<long>> _store = new();

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
