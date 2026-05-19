using Mulkchi.Api.Models.Foundations.Amenities;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<Amenity> InsertAmenityAsync(Amenity amenity);
    IQueryable<Amenity> SelectAllAmenities();
    ValueTask<Amenity?> SelectAmenityByIdAsync(Guid id);
    ValueTask<Amenity> UpdateAmenityAsync(Amenity amenity);
    ValueTask<Amenity> DeleteAmenityAsync(Amenity amenity);

    ValueTask<PropertyAmenity> InsertPropertyAmenityAsync(PropertyAmenity propertyAmenity);
    IQueryable<PropertyAmenity> SelectAllPropertyAmenities();
    ValueTask<PropertyAmenity> DeletePropertyAmenityAsync(PropertyAmenity propertyAmenity);
}
