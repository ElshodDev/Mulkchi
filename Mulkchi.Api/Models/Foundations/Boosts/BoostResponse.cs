namespace Mulkchi.Api.Models.Foundations.Boosts;

public class BoostResponse
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public string PropertyTitle { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; }
    public BoostPlan Plan { get; set; }
    public string PlanName { get; set; }
    public decimal Amount { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public BoostStatus Status { get; set; }
    public int DaysRemaining { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}
