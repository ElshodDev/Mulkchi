using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Boosts;

public class Boost
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public Guid UserId { get; set; }
    public BoostPlan Plan { get; set; }
    public decimal Amount { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public BoostStatus Status { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }

    public virtual Property Property { get; set; }
    public virtual User User { get; set; }
}

public enum BoostPlan
{
    Bronze = 1,  // 1 day, 10,000 UZS
    Silver = 2,  // 3 days, 25,000 UZS
    Gold = 3     // 7 days, 50,000 UZS
}

public enum BoostStatus
{
    Active = 1,
    Expired = 2,
    Cancelled = 3
}
