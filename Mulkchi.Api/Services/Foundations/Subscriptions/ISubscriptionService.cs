using Mulkchi.Api.Models.Foundations.Subscriptions;

namespace Mulkchi.Api.Services.Foundations.Subscriptions;

public interface ISubscriptionService
{
    // Plans (public)
    IEnumerable<SubscriptionPlan> GetAllPlans();
    SubscriptionPlan? GetPlanById(Guid id);
    SubscriptionPlan? GetPlanByType(SubscriptionPlanType type);

    // User Subscriptions
    ValueTask<SubscriptionResponse?> GetMySubscriptionAsync(Guid userId);
    ValueTask<SubscriptionResponse> SubscribeAsync(SubscriptionCreateDto dto, Guid userId);
    ValueTask<SubscriptionResponse?> CancelSubscriptionAsync(Guid userId);
    ValueTask<SubscriptionResponse?> UpgradeSubscriptionAsync(Guid newPlanId, Guid userId);
    ValueTask<SubscriptionResponse> RenewSubscriptionAsync(Guid userId);
    ValueTask<bool> CanCreateListingAsync(Guid userId);
    ValueTask<int> GetUserListingCountAsync(Guid userId);
    ValueTask UseBoostAsync(Guid userId);
    ValueTask<int> GetRemainingBoostsAsync(Guid userId);
    ValueTask<IEnumerable<SubscriptionResponse>> GetAllSubscriptionsAsync();
    ValueTask ExpireSubscriptionsAsync();
    ValueTask<IEnumerable<SubscriptionResponse>> GetExpiringSoonAsync(int daysBeforeExpiry);
}
