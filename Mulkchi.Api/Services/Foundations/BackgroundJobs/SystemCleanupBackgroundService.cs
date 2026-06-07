using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Mulkchi.Api.Brokers.Storages;

namespace Mulkchi.Api.Services.Foundations.BackgroundJobs
{
    public class SystemCleanupBackgroundService : BackgroundService
    {
        private readonly ILogger<SystemCleanupBackgroundService> logger;
        private readonly IServiceProvider serviceProvider;

        public SystemCleanupBackgroundService(
            ILogger<SystemCleanupBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            this.logger = logger;
            this.serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            this.logger.LogInformation("SystemCleanupBackgroundService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredRecordsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    this.logger.LogError(ex, "Error occurred executing SystemCleanupBackgroundService.");
                }

                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }

        private async Task CleanupExpiredRecordsAsync(CancellationToken stoppingToken)
        {
            using var scope = this.serviceProvider.CreateScope();
            var storageBroker = scope.ServiceProvider.GetRequiredService<IStorageBroker>();

            // 1. Delete Expired Booking Holds
            await storageBroker.DeleteExpiredBookingHoldsAsync();

            // 2. Expire Boosts
            var now = DateTimeOffset.UtcNow;
            var expiredBoosts = await storageBroker.SelectAllBoosts()
                .Where(b => b.Status == Models.Foundations.Boosts.BoostStatus.Active && b.EndDate < now)
                .ToListAsync(stoppingToken);

            foreach (var boost in expiredBoosts)
            {
                boost.Status = Models.Foundations.Boosts.BoostStatus.Expired;
                boost.UpdatedDate = now;
                await storageBroker.UpdateBoostAsync(boost);
            }

            if (expiredBoosts.Count > 0)
            {
                this.logger.LogInformation($"System cleanup completed: {expiredBoosts.Count} boosts expired.");
            }
        }
    }
}
