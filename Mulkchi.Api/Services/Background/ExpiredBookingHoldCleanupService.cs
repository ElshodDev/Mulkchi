using Mulkchi.Api.Brokers.Storages;

namespace Mulkchi.Api.Services.Background;

public sealed class ExpiredBookingHoldCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory serviceScopeFactory;
    private readonly ILogger<ExpiredBookingHoldCleanupService> logger;
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(1);

    public ExpiredBookingHoldCleanupService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<ExpiredBookingHoldCleanupService> logger)
    {
        this.serviceScopeFactory = serviceScopeFactory;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CleanupInterval);

        while (!stoppingToken.IsCancellationRequested &&
               await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = this.serviceScopeFactory.CreateScope();
                var storageBroker = scope.ServiceProvider.GetRequiredService<IStorageBroker>();
                await storageBroker.DeleteExpiredBookingHoldsAsync();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // graceful shutdown
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Failed to cleanup expired booking holds.");
            }
        }
    }
}
