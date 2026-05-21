namespace Mulkchi.Api.Models.Foundations.Compare;

public class PropertyComparisonDetail
{
    public Guid PropertyId { get; set; }
    public string Title { get; set; }
    public decimal? Price { get; set; }
    public int Area { get; set; }
    public int Bedrooms { get; set; }
    public string District { get; set; }
    public List<string> Pros { get; set; }
    public List<string> Cons { get; set; }
    public int Score { get; set; }
    public string ValueRating { get; set; } // e.g. "Zo'r tanlov", "Qimmatroq", "O'rtacha"
}
