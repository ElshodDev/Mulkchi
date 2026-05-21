using Mulkchi.Api.Models.Foundations.Compare;

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
