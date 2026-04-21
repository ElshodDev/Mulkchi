using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Chat;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<ChatSession> ChatSessions { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }

    public async ValueTask<ChatSession> InsertChatSessionAsync(ChatSession session)
    {
        this.ChatSessions.Add(session);
        await this.SaveChangesAsync();
        return session;
    }

    public IQueryable<ChatSession> SelectAllChatSessions() =>
        this.ChatSessions.AsQueryable();

    public async ValueTask<ChatSession?> SelectChatSessionByIdAsync(string id) =>
        await this.ChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == id);

    public async ValueTask<ChatSession> UpdateChatSessionAsync(ChatSession session)
    {
        this.ChatSessions.Update(session);
        await this.SaveChangesAsync();
        return session;
    }

    public async ValueTask<ChatMessage> InsertChatMessageAsync(ChatMessage message)
    {
        this.ChatMessages.Add(message);
        await this.SaveChangesAsync();
        return message;
    }

    public IQueryable<ChatMessage> SelectAllChatMessages() =>
        this.ChatMessages.AsQueryable();
}
