using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Outbox;

namespace Mulkchi.Api.Services.Background;

public sealed class OutboxProcessorService : BackgroundService
{
    private readonly IServiceScopeFactory serviceScopeFactory;
    private readonly ILogger<OutboxProcessorService> logger;
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(10);
    private const int BatchSize = 50;

    public OutboxProcessorService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<OutboxProcessorService> logger)
    {
        this.serviceScopeFactory = serviceScopeFactory;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested &&
               await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = this.serviceScopeFactory.CreateScope();
                var storage = scope.ServiceProvider.GetRequiredService<StorageBroker>();

                List<OutboxMessage> pending = await storage.SelectOutboxMessages()
                    .Where(x => x.ProcessedDate == null && x.RetryCount < 10)
                    .OrderBy(x => x.CreatedDate)
                    .Take(BatchSize)
                    .ToListAsync(stoppingToken);

                foreach (OutboxMessage message in pending)
                {
                    try
                    {
                        this.logger.LogInformation(
                            "Outbox published. Type={Type} Id={Id}",
                            message.Type,
                            message.Id);

                        message.ProcessedDate = DateTimeOffset.UtcNow;
                        message.LastError = null;
                    }
                    catch (Exception ex)
                    {
                        message.RetryCount += 1;
                        message.LastError = ex.Message;
                    }
                }

                if (pending.Count > 0)
                {
                    await storage.SaveChangesAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Outbox processor iteration failed.");
            }
        }
    }
}
