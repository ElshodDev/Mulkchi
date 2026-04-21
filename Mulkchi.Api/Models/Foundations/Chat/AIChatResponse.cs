namespace Mulkchi.Api.Models.Foundations.Chat;

public class AIChatResponse
{
    public string Message { get; set; }
    public string SessionId { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public List<PropertySuggestion>? SuggestedProperties { get; set; }
    public ComparisonResult? Comparison { get; set; }
}

public class PropertySuggestion
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string? Reason { get; set; }
}

public class ComparisonResult
{
    public List<Guid> ComparedPropertyIds { get; set; }
    public string Summary { get; set; }
    public List<PropertyComparisonDetail> Details { get; set; }
    public string Recommendation { get; set; }
}

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
}
