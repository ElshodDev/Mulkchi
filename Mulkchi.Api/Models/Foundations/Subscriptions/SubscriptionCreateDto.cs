namespace Mulkchi.Api.Models.Foundations.Subscriptions;

public class SubscriptionCreateDto
{
    public Guid PlanId { get; set; }
    public bool AutoRenew { get; set; } = true;
    public string? PaymentMethod { get; set; }
}
