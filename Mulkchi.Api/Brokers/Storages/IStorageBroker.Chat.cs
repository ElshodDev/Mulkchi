using Mulkchi.Api.Models.Foundations.Chat;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<ChatSession> InsertChatSessionAsync(ChatSession session);
    IQueryable<ChatSession> SelectAllChatSessions();
    ValueTask<ChatSession?> SelectChatSessionByIdAsync(string id);
    ValueTask<ChatSession> UpdateChatSessionAsync(ChatSession session);

    ValueTask<ChatMessage> InsertChatMessageAsync(ChatMessage message);
    IQueryable<ChatMessage> SelectAllChatMessages();
}
