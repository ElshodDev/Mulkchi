using Mulkchi.Api.Models.Foundations.Subscriptions;

namespace Mulkchi.Api.Services.Foundations.Subscriptions;

public partial class SubscriptionService
{
    private static void ValidateSubscriptionOnCreate(UserSubscription subscription)
    {
        if (subscription is null)
            throw new ArgumentNullException(nameof(subscription));

        if (subscription.UserId == Guid.Empty)
            throw new ArgumentException("UserId is required.", nameof(subscription));

        if (subscription.PlanId == Guid.Empty)
            throw new ArgumentException("PlanId is required.", nameof(subscription));

        if (subscription.EndDate <= subscription.StartDate)
            throw new ArgumentException("EndDate must be after StartDate.", nameof(subscription));
    }
}
