using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Subscriptions;

namespace Mulkchi.Api.Services.Background;

/// <summary>
/// Background service for automatic subscription renewal.
/// Runs daily via Hangfire to check and renew subscriptions with AutoRenew=true
/// </summary>
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

    /// <summary>
    /// Process subscription renewals for expired subscriptions with AutoRenew enabled.
    /// Called daily via Hangfire background job.
    /// </summary>
    public async ValueTask RenewExpiredSubscriptionsAsync()
    {
        try
        {
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            
            // Find all subscriptions that:
            // 1. Have ended (EndDate <= now)
            // 2. Have AutoRenew enabled
            // 3. Are not already cancelled
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
                    // Check if plan still exists and is active
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

                    // Renew the subscription
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
                    this.loggingBroker.LogError(
                        ex,
                        $"Failed to renew subscription {subscription.Id}: {ex.Message}");
                }
            }

            this.loggingBroker.LogInformation(
                $"Subscription renewal completed. Renewed: {renewedCount}, Failed: {failedCount}");
        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(ex, "Error in subscription renewal process");
            throw;
        }
    }

    /// <summary>
    /// Send expiration reminder emails to users with subscriptions expiring in 3 days.
    /// Called daily via Hangfire.
    /// </summary>
    public async ValueTask SendExpirationRemindersAsync()
    {
        try
        {
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            var reminderDate = now.AddDays(3);

            // Find subscriptions expiring in 3 days (with margin of 1 day)
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
            
            // TODO: Send reminder emails when EmailNotificationService is fully implemented
            // This is a placeholder for future email notification logic
        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(ex, "Error sending expiration reminders");
        }
    }
}
