using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<Property> Properties { get; set; }

    public async ValueTask<Property> InsertPropertyAsync(Property property)
    {
        var entry = await this.Properties.AddAsync(property);
        await this.SaveChangesAsync();
        return entry.Entity;
    }

    public IQueryable<Property> SelectAllProperties()
        => this.Properties
            .Include(p => p.Images.OrderBy(img => img.SortOrder))
            .AsQueryable();

    public async ValueTask<Property> SelectPropertyByIdAsync(Guid propertyId)
        => (await this.Properties
            .Include(p => p.Images.OrderBy(img => img.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == propertyId))!;

    public async ValueTask<Property> UpdatePropertyAsync(Property property)
    {
        this.Entry(property).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return property;
    }

    public async ValueTask<Property> DeletePropertyByIdAsync(Guid propertyId)
    {
        Property property = (await this.Properties.FindAsync(propertyId))!;
        property.DeletedDate = DateTimeOffset.UtcNow;
        property.UpdatedDate = DateTimeOffset.UtcNow;
        this.Entry(property).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return property;
    }

    public IQueryable<Property> SelectAllPropertiesIncludingDeleted()
        => this.Properties
            .IgnoreQueryFilters()
            .Include(p => p.Images.OrderBy(img => img.SortOrder))
            .AsQueryable();

    public async ValueTask<Property> SelectPropertyByIdIncludingDeletedAsync(Guid propertyId)
        => (await this.Properties
            .IgnoreQueryFilters()
            .Include(p => p.Images.OrderBy(img => img.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == propertyId))!;
}
