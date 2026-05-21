namespace Mulkchi.Api.Models.Foundations.Compare;

public class ComparisonResult
{
    public List<Guid> ComparedPropertyIds { get; set; }
    public string Summary { get; set; }
    public List<PropertyComparisonDetail> Details { get; set; }
    public string Recommendation { get; set; }
}
