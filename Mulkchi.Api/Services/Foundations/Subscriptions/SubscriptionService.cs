using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Subscriptions;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Services.Foundations.Subscriptions;

public partial class SubscriptionService : ISubscriptionService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;

    public SubscriptionService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
    }

    public IEnumerable<SubscriptionPlan> GetAllPlans()
    {
        return this.storageBroker.SelectAllSubscriptionPlans()
            .Where(p => p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .ToList();
    }

    public SubscriptionPlan? GetPlanById(Guid id)
    {
        return this.storageBroker.SelectAllSubscriptionPlans()
            .FirstOrDefault(p => p.Id == id && p.IsActive);
    }

    public SubscriptionPlan? GetPlanByType(SubscriptionPlanType type)
    {
        return this.storageBroker.SelectAllSubscriptionPlans()
            .FirstOrDefault(p => p.Name == type.ToString() && p.IsActive);
    }

    public async ValueTask<SubscriptionResponse?> GetMySubscriptionAsync(Guid userId)
    {
        var subscription = await this.storageBroker.SelectAllUserSubscriptions()
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.CreatedDate)
            .FirstOrDefaultAsync();

        if (subscription is null)
            return null;

        return ToSubscriptionResponse(subscription);
    }

    public async ValueTask<SubscriptionResponse> SubscribeAsync(SubscriptionCreateDto dto, Guid userId)
    {
        var plan = GetPlanById(dto.PlanId);
        if (plan is null)
            throw new ArgumentException("Obuna rejasi topilmadi.");

        // Check if user already has an active subscription
        var existingSub = await this.storageBroker.SelectAllUserSubscriptions()
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();

        if (existingSub is not null)
        {
            // Cancel existing subscription
            existingSub.Status = SubscriptionStatus.Cancelled;
            existingSub.UpdatedDate = now;
            existingSub.AutoRenew = false;
            await this.storageBroker.UpdateUserSubscriptionAsync(existingSub);
        }

        // Create new subscription
        var newSubscription = new UserSubscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PlanId = plan.Id,
            StartDate = now,
            EndDate = now.AddMonths(1),
            Status = plan.MonthlyPrice == 0 ? SubscriptionStatus.Active : SubscriptionStatus.PendingPayment,
            AutoRenew = dto.AutoRenew,
            PaymentMethod = dto.PaymentMethod,
            RemainingBoosts = plan.MonthlyBoosts,
            CreatedDate = now
        };

        var addedSubscription = await this.storageBroker.InsertUserSubscriptionAsync(newSubscription);
        addedSubscription.Plan = plan;

        return ToSubscriptionResponse(addedSubscription);
    }

    public async ValueTask<SubscriptionResponse?> CancelSubscriptionAsync(Guid userId)
    {
        var subscription = await this.storageBroker.SelectAllUserSubscriptions()
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

        if (subscription is null)
            return null;

        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.AutoRenew = false;
        subscription.UpdatedDate = now;

        var updated = await this.storageBroker.UpdateUserSubscriptionAsync(subscription);
        return ToSubscriptionResponse(updated);
    }

    public async ValueTask<SubscriptionResponse?> UpgradeSubscriptionAsync(Guid newPlanId, Guid userId)
    {
        var currentSub = await this.storageBroker.SelectAllUserSubscriptions()
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

        if (currentSub is null)
            throw new InvalidOperationException("Sizda faol obuna mavjud emas.");

        var newPlan = GetPlanById(newPlanId);
        if (newPlan is null)
            throw new ArgumentException("Yangi obuna rejasi topilmadi.");

        // Check if it's actually an upgrade
        var currentOrder = currentSub.Plan?.DisplayOrder ?? 0;
        if (newPlan.DisplayOrder <= currentOrder)
            throw new InvalidOperationException("Faqat yuqori tarifga o'tish mumkin.");

        // Cancel current subscription
        await CancelSubscriptionAsync(userId);

        // Subscribe to new plan
        return await SubscribeAsync(new SubscriptionCreateDto
        {
            PlanId = newPlanId,
            AutoRenew = true
        }, userId);
    }

    public async ValueTask<SubscriptionResponse> RenewSubscriptionAsync(Guid userId)
    {
        var subscription = await this.storageBroker.SelectAllUserSubscriptions()
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (subscription is null)
            throw new InvalidOperationException("Obuna topilmadi.");

        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();

        // Extend by one month from end date
        subscription.EndDate = subscription.EndDate.AddMonths(1);
        subscription.Status = SubscriptionStatus.Active;
        subscription.RemainingBoosts = subscription.Plan?.MonthlyBoosts ?? 0;
        subscription.UpdatedDate = now;

        var updated = await this.storageBroker.UpdateUserSubscriptionAsync(subscription);
        updated.Plan = subscription.Plan;

        return ToSubscriptionResponse(updated);
    }

    public async ValueTask<bool> CanCreateListingAsync(Guid userId)
    {
        var subscription = await GetMySubscriptionAsync(userId);
        if (subscription is null)
        {
            // Free plan: max 3 listings
            var listingCount = await GetUserListingCountAsync(userId);
            return listingCount < 3;
        }

        if (subscription.MaxListings == -1) // Unlimited
            return true;

        var count = await GetUserListingCountAsync(userId);
        return count < subscription.MaxListings;
    }

    public async ValueTask<int> GetUserListingCountAsync(Guid userId)
    {
        return await this.storageBroker.SelectAllProperties()
            .CountAsync(p => p.HostId == userId && p.DeletedDate == null);
    }

    public async ValueTask UseBoostAsync(Guid userId)
    {
        var subscription = await this.storageBroker.SelectAllUserSubscriptions()
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

        if (subscription is null)
            throw new InvalidOperationException("Faol obuna mavjud emas.");

        if (subscription.RemainingBoosts <= 0)
            throw new InvalidOperationException("Sizda ko'tarishlar qolmagan.");

        subscription.RemainingBoosts--;
        subscription.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        await this.storageBroker.UpdateUserSubscriptionAsync(subscription);
    }

    public async ValueTask<int> GetRemainingBoostsAsync(Guid userId)
    {
        var subscription = await this.storageBroker.SelectAllUserSubscriptions()
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);

        return subscription?.RemainingBoosts ?? 0;
    }

    public async ValueTask<IEnumerable<SubscriptionResponse>> GetAllSubscriptionsAsync()
    {
        var subscriptions = await this.storageBroker.SelectAllUserSubscriptions()
            .Include(s => s.Plan)
            .Include(s => s.User)
            .OrderByDescending(s => s.CreatedDate)
            .ToListAsync();

        return subscriptions.Select(ToSubscriptionResponse);
    }

    public async ValueTask ExpireSubscriptionsAsync()
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var expiredSubs = await this.storageBroker.SelectAllUserSubscriptions()
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate <= now)
            .ToListAsync();

        foreach (var sub in expiredSubs)
        {
            if (sub.AutoRenew)
            {
                // Try to renew
                try
                {
                    await RenewSubscriptionAsync(sub.UserId);
                }
                catch
                {
                    // If renewal fails, mark as expired
                    sub.Status = SubscriptionStatus.Expired;
                    sub.UpdatedDate = now;
                    await this.storageBroker.UpdateUserSubscriptionAsync(sub);
                }
            }
            else
            {
                sub.Status = SubscriptionStatus.Expired;
                sub.UpdatedDate = now;
                await this.storageBroker.UpdateUserSubscriptionAsync(sub);
            }
        }
    }

    public async ValueTask<IEnumerable<SubscriptionResponse>> GetExpiringSoonAsync(int daysBeforeExpiry)
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var threshold = now.AddDays(daysBeforeExpiry);

        var subs = await this.storageBroker.SelectAllUserSubscriptions()
            .Include(s => s.Plan)
            .Include(s => s.User)
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate <= threshold && s.EndDate > now)
            .OrderBy(s => s.EndDate)
            .ToListAsync();

        return subs.Select(ToSubscriptionResponse);
    }

    private SubscriptionResponse ToSubscriptionResponse(UserSubscription subscription)
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var daysRemaining = subscription.EndDate > now ? (int)(subscription.EndDate - now).TotalDays : 0;

        var plan = subscription.Plan;
        var user = subscription.User;

        return new SubscriptionResponse
        {
            Id = subscription.Id,
            UserId = subscription.UserId,
            UserName = user is not null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown",
            PlanId = subscription.PlanId,
            PlanName = plan?.Name ?? "Unknown",
            PlanNameUz = plan?.NameUz ?? "Unknown",
            PlanNameRu = plan?.NameRu ?? "Unknown",
            MonthlyPrice = plan?.MonthlyPrice ?? 0,
            MaxListings = plan?.MaxListings ?? 3,
            MonthlyBoosts = plan?.MonthlyBoosts ?? 0,
            RemainingBoosts = subscription.RemainingBoosts,
            HasAnalytics = plan?.HasAnalytics ?? false,
            HasFeaturedPlacement = plan?.HasFeaturedPlacement ?? false,
            HasVerifiedBadge = plan?.HasVerifiedBadge ?? false,
            HasPrioritySupport = plan?.HasPrioritySupport ?? false,
            StartDate = subscription.StartDate,
            EndDate = subscription.EndDate,
            Status = subscription.Status,
            AutoRenew = subscription.AutoRenew,
            DaysRemaining = daysRemaining,
            CreatedDate = subscription.CreatedDate
        };
    }
}
