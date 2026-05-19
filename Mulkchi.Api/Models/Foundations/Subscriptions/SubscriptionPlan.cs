namespace Mulkchi.Api.Models.Foundations.Subscriptions;

public class SubscriptionPlan
{
    public Guid Id { get; set; }
    public string Name { get; set; } // Free, Standard, Premium, Agent
    public string NameUz { get; set; }
    public string NameRu { get; set; }
    public string Description { get; set; }
    public string DescriptionUz { get; set; }
    public string DescriptionRu { get; set; }
    public decimal MonthlyPrice { get; set; }
    public int MaxListings { get; set; } // -1 = unlimited
    public int MonthlyBoosts { get; set; }
    public bool HasAnalytics { get; set; }
    public bool HasFeaturedPlacement { get; set; }
    public bool HasVerifiedBadge { get; set; }
    public bool HasPrioritySupport { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? UpdatedDate { get; set; }
}

public enum SubscriptionPlanType
{
    Free = 0,
    Standard = 1,
    Premium = 2,
    Agent = 3
}
