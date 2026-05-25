using Mulkchi.Api.Models.Foundations.Properties;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Mulkchi.Api.Services.Foundations.Properties;

public interface IPropertyService
{
    ValueTask<PropertyResponse> AddPropertyAsync(PropertyCreateDto dto);
    ValueTask<Property> AddPropertyAsync(Property property);
    ValueTask<(IEnumerable<PropertyResponse> Items, int TotalCount)> RetrieveAllPropertiesAsync(PropertyQueryParams queryParams);

    ValueTask<IEnumerable<string>> SearchLocationSuggestionsAsync(string query);
    ValueTask<IEnumerable<PropertyResponse>> RetrieveSimilarPropertiesAsync(Guid propertyId, int count = 6);
    ValueTask<IEnumerable<PropertyResponse>> RetrieveFeaturedPropertiesAsync(int count = 8);

    // Existing base methods format preserved where necessary
    IQueryable<Property> RetrieveAllProperties();
    ValueTask<Property?> RetrievePropertyByIdAsync(Guid propertyId);
    ValueTask<Property?> RetrievePropertyEntityByIdAsync(Guid propertyId);
    ValueTask<Property> ModifyPropertyAsync(Property property);
    ValueTask<Property> RemovePropertyByIdAsync(Guid propertyId);

    ValueTask<(IEnumerable<PropertyResponse> Items, int TotalCount)> SearchPropertiesAsync(PropertySearchParams searchParams);

    // New enhancement methods
    ValueTask<(IEnumerable<PropertyResponse> Items, int TotalCount)> RetrieveMyPropertiesAsync(PropertyQueryParams queryParams);
    ValueTask<IEnumerable<PropertyResponse>> RetrieveNewListingsAsync(int days, int count);
    ValueTask<PropertyResponse> PublishPropertyAsync(Guid propertyId);
    ValueTask<PropertyResponse> UnpublishPropertyAsync(Guid propertyId);
    ValueTask<Property> VerifyPropertyAsync(Guid propertyId);
    ValueTask<PropertyCreateResponse> AddPropertyWithUserUpgradeAsync(PropertyCreateDto dto, ClaimsPrincipal user);
}
