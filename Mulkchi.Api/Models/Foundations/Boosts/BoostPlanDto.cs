namespace Mulkchi.Api.Models.Foundations.Boosts;

public class BoostPlanDto
{
    public BoostPlan Plan { get; set; }
    public string Name { get; set; }
    public string NameUz { get; set; }
    public string NameRu { get; set; }
    public int DurationDays { get; set; }
    public decimal Price { get; set; }
    public string Description { get; set; }
    public string DescriptionUz { get; set; }
    public string DescriptionRu { get; set; }
}
