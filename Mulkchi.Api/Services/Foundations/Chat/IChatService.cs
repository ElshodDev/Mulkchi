using Mulkchi.Api.Models.Foundations.Chat;

namespace Mulkchi.Api.Services.Foundations.Chat;

public interface IChatService
{
    ValueTask<ChatSession> StartSessionAsync(Guid? userId);
    ValueTask EndSessionAsync(string sessionId);
    ValueTask<IEnumerable<ChatSession>> GetUserSessionsAsync(Guid userId);
    ValueTask<IEnumerable<ChatMessage>> GetSessionMessagesAsync(string sessionId);

    ValueTask<AIChatResponse> ProcessMessageAsync(AIChatRequest request, Guid? userId);



    ValueTask<string> DetectIntentAsync(string message);
}
