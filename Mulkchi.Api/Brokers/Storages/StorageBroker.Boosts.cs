using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Boosts;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<Boost> Boosts { get; set; }

    public async ValueTask<Boost> InsertBoostAsync(Boost boost)
    {
        this.Boosts.Add(boost);
        await this.SaveChangesAsync();
        return boost;
    }

    public IQueryable<Boost> SelectAllBoosts() =>
        this.Boosts.AsQueryable();

    public async ValueTask<Boost> SelectBoostByIdAsync(Guid id) =>
        await this.Boosts
            .Include(b => b.Property)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == id);

    public async ValueTask<Boost> UpdateBoostAsync(Boost boost)
    {
        this.Boosts.Update(boost);
        await this.SaveChangesAsync();
        return boost;
    }

    public async ValueTask<Boost> DeleteBoostAsync(Boost boost)
    {
        this.Boosts.Remove(boost);
        await this.SaveChangesAsync();
        return boost;
    }
}
