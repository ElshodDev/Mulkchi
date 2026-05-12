using Mulkchi.Api.Services.Foundations.Users;

namespace Mulkchi.Api.Services.Background;

public sealed class RedisPresenceCleanupService : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(5);

    private readonly IUserConnectionTracker connectionTracker;
    private readonly ILogger<RedisPresenceCleanupService> logger;

    public RedisPresenceCleanupService(
        IUserConnectionTracker connectionTracker,
        ILogger<RedisPresenceCleanupService> logger)
    {
        this.connectionTracker = connectionTracker;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(SweepInterval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await this.connectionTracker.CleanupExpiredConnectionsAsync(stoppingToken);
                this.logger.LogDebug("Presence cleanup sweep completed.");
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception exception)
            {
                this.logger.LogWarning(exception, "Presence cleanup sweep failed.");
            }
        }
    }
}
