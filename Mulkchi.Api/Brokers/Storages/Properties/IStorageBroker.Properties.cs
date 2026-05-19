using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<Property> InsertPropertyAsync(Property property);
    IQueryable<Property> SelectAllProperties();
    ValueTask<Property> SelectPropertyByIdAsync(Guid propertyId);
    ValueTask<Property> UpdatePropertyAsync(Property property);
    ValueTask<Property> DeletePropertyByIdAsync(Guid propertyId);
    
    // Admin methods to bypass soft delete filters
    IQueryable<Property> SelectAllPropertiesIncludingDeleted();
    ValueTask<Property> SelectPropertyByIdIncludingDeletedAsync(Guid propertyId);
}
