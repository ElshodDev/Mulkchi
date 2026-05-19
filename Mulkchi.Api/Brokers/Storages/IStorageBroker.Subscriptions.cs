using Mulkchi.Api.Models.Foundations.Subscriptions;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<SubscriptionPlan> InsertSubscriptionPlanAsync(SubscriptionPlan plan);
    IQueryable<SubscriptionPlan> SelectAllSubscriptionPlans();
    ValueTask<SubscriptionPlan?> SelectSubscriptionPlanByIdAsync(Guid id);
    ValueTask<SubscriptionPlan> UpdateSubscriptionPlanAsync(SubscriptionPlan plan);
    ValueTask<SubscriptionPlan> DeleteSubscriptionPlanAsync(SubscriptionPlan plan);

    ValueTask<UserSubscription> InsertUserSubscriptionAsync(UserSubscription subscription);
    IQueryable<UserSubscription> SelectAllUserSubscriptions();
    ValueTask<UserSubscription?> SelectUserSubscriptionByIdAsync(Guid id);
    ValueTask<UserSubscription> UpdateUserSubscriptionAsync(UserSubscription subscription);
    ValueTask<UserSubscription> DeleteUserSubscriptionAsync(UserSubscription subscription);
}
