using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Amenities;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<Amenity> Amenities { get; set; }
    public DbSet<PropertyAmenity> PropertyAmenities { get; set; }

    public async ValueTask<Amenity> InsertAmenityAsync(Amenity amenity)
    {
        this.Amenities.Add(amenity);
        await this.SaveChangesAsync();
        return amenity;
    }

    public IQueryable<Amenity> SelectAllAmenities() =>
        this.Amenities.AsQueryable();

    public async ValueTask<Amenity?> SelectAmenityByIdAsync(Guid id) =>
        await this.Amenities.FindAsync(id);

    public async ValueTask<Amenity> UpdateAmenityAsync(Amenity amenity)
    {
        this.Amenities.Update(amenity);
        await this.SaveChangesAsync();
        return amenity;
    }

    public async ValueTask<Amenity> DeleteAmenityAsync(Amenity amenity)
    {
        this.Amenities.Remove(amenity);
        await this.SaveChangesAsync();
        return amenity;
    }

    public async ValueTask<PropertyAmenity> InsertPropertyAmenityAsync(PropertyAmenity propertyAmenity)
    {
        this.PropertyAmenities.Add(propertyAmenity);
        await this.SaveChangesAsync();
        return propertyAmenity;
    }

    public IQueryable<PropertyAmenity> SelectAllPropertyAmenities() =>
        this.PropertyAmenities.AsQueryable();

    public async ValueTask<PropertyAmenity> DeletePropertyAmenityAsync(PropertyAmenity propertyAmenity)
    {
        this.PropertyAmenities.Remove(propertyAmenity);
        await this.SaveChangesAsync();
        return propertyAmenity;
    }
}
