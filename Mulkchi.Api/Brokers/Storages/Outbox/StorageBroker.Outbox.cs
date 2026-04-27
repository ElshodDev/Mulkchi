using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Outbox;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<OutboxMessage> OutboxMessages { get; set; }

    public async ValueTask<OutboxMessage> InsertOutboxMessageAsync(OutboxMessage message)
    {
        var entry = await this.OutboxMessages.AddAsync(message);
        await this.SaveChangesAsync();
        return entry.Entity;
    }

    public IQueryable<OutboxMessage> SelectOutboxMessages() =>
        this.OutboxMessages.AsQueryable();

    public async ValueTask<OutboxMessage> UpdateOutboxMessageAsync(OutboxMessage message)
    {
        this.Entry(message).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return message;
    }
}
