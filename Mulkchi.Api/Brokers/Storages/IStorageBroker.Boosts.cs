using Mulkchi.Api.Models.Foundations.Boosts;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<Boost> InsertBoostAsync(Boost boost);
    IQueryable<Boost> SelectAllBoosts();
    ValueTask<Boost?> SelectBoostByIdAsync(Guid id);
    ValueTask<Boost> UpdateBoostAsync(Boost boost);
    ValueTask<Boost> DeleteBoostAsync(Boost boost);
}
