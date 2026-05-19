using Mulkchi.Api.Models.Foundations.Outbox;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<OutboxMessage> InsertOutboxMessageAsync(OutboxMessage message);
    IQueryable<OutboxMessage> SelectOutboxMessages();
    ValueTask<OutboxMessage> UpdateOutboxMessageAsync(OutboxMessage message);
}
