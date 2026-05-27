using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Subscriptions;

namespace Mulkchi.Api.Services.Background;

public class SubscriptionRenewalService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;

    public SubscriptionRenewalService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
    }

    public async Task RenewExpiredSubscriptionsAsync()
    {
        try
        {
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();

            var expiredSubscriptions = await this.storageBroker
                .SelectAllUserSubscriptions()
                .Include(s => s.Plan)
                .Where(s =>
                    s.EndDate <= now &&
                    s.AutoRenew == true &&
                    s.Status != SubscriptionStatus.Cancelled)
                .ToListAsync();

            if (expiredSubscriptions.Count == 0)
            {
                this.loggingBroker.LogInformation("No subscriptions to renew today.");
                return;
            }

            this.loggingBroker.LogInformation(
                $"Starting auto-renewal process for {expiredSubscriptions.Count} subscriptions.");

            int renewedCount = 0;
            int failedCount = 0;

            foreach (var subscription in expiredSubscriptions)
            {
                try
                {
                    if (subscription.Plan is null || !subscription.Plan.IsActive)
                    {
                        this.loggingBroker.LogWarning(
                            $"Subscription {subscription.Id} has inactive/missing plan. Cancelling auto-renew.");

                        subscription.AutoRenew = false;
                        subscription.Status = SubscriptionStatus.Cancelled;
                        await this.storageBroker.UpdateUserSubscriptionAsync(subscription);
                        failedCount++;
                        continue;
                    }

                    subscription.StartDate = now;
                    subscription.EndDate = now.AddMonths(1);
                    subscription.Status = SubscriptionStatus.Active;
                    subscription.RemainingBoosts = subscription.Plan.MonthlyBoosts;
                    subscription.UpdatedDate = now;

                    await this.storageBroker.UpdateUserSubscriptionAsync(subscription);
                    renewedCount++;

                    this.loggingBroker.LogInformation(
                        $"Successfully renewed subscription {subscription.Id} " +
                        $"for user {subscription.UserId} ({subscription.Plan.NameUz ?? subscription.Plan.Name}).");
                }
                catch (Exception ex)
                {
                    failedCount++;
                    this.loggingBroker.LogError(ex);
                }
            }

            this.loggingBroker.LogInformation(
                $"Subscription renewal completed. Renewed: {renewedCount}, Failed: {failedCount}");
        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(ex);
            throw;
        }
    }

    public async Task SendExpirationRemindersAsync()
    {
        try
        {
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            var reminderDate = now.AddDays(3);

            var expiringSubscriptions = await this.storageBroker
                .SelectAllUserSubscriptions()
                .Include(s => s.Plan)
                .Where(s =>
                    s.EndDate > now &&
                    s.EndDate <= reminderDate &&
                    s.Status == SubscriptionStatus.Active)
                .ToListAsync();

            if (expiringSubscriptions.Count == 0)
            {
                this.loggingBroker.LogInformation("No subscriptions expiring soon.");
                return;
            }

            this.loggingBroker.LogInformation(
                $"Found {expiringSubscriptions.Count} subscriptions expiring soon. " +
                "Note: Email notification implementation pending.");

        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(ex);
        }
    }
}
