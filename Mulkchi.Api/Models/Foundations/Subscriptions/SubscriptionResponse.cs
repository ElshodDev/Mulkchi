namespace Mulkchi.Api.Models.Foundations.Subscriptions;

public class SubscriptionResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; }
    public Guid PlanId { get; set; }
    public string PlanName { get; set; }
    public string PlanNameUz { get; set; }
    public string PlanNameRu { get; set; }
    public decimal MonthlyPrice { get; set; }
    public int MaxListings { get; set; }
    public int MonthlyBoosts { get; set; }
    public int RemainingBoosts { get; set; }
    public bool HasAnalytics { get; set; }
    public bool HasFeaturedPlacement { get; set; }
    public bool HasVerifiedBadge { get; set; }
    public bool HasPrioritySupport { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public SubscriptionStatus Status { get; set; }
    public bool AutoRenew { get; set; }
    public int DaysRemaining { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}
