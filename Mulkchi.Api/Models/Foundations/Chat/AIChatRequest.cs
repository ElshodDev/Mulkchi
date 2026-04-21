namespace Mulkchi.Api.Models.Foundations.Chat;

public class AIChatRequest
{
    public string Message { get; set; }
    public string? SessionId { get; set; } // Optional - to maintain context
    public List<Guid>? PropertyIds { get; set; } // For property-related questions
}
