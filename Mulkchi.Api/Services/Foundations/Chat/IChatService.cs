using Mulkchi.Api.Models.Foundations.Chat;

namespace Mulkchi.Api.Services.Foundations.Chat;

public interface IChatService
{
    // Chat Session Management
    ValueTask<ChatSession> StartSessionAsync(Guid? userId);
    ValueTask EndSessionAsync(string sessionId);
    ValueTask<IEnumerable<ChatSession>> GetUserSessionsAsync(Guid userId);
    ValueTask<IEnumerable<ChatMessage>> GetSessionMessagesAsync(string sessionId);

    // AI Chat
    ValueTask<AIChatResponse> ProcessMessageAsync(AIChatRequest request, Guid? userId);

    // Property Comparison
    ValueTask<ComparisonResult> ComparePropertiesAsync(List<Guid> propertyIds);
    ValueTask<string> GenerateComparisonSummaryAsync(List<Guid> propertyIds);

    // Intent Detection
    ValueTask<string> DetectIntentAsync(string message); // "search", "compare", "general", "price"
}
