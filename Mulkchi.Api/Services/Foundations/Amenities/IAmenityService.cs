using Mulkchi.Api.Models.Foundations.Amenities;

namespace Mulkchi.Api.Services.Foundations.Amenities;

public interface IAmenityService
{
    ValueTask<AmenityResponse> AddAmenityAsync(AmenityCreateDto dto);
    IEnumerable<AmenityResponse> RetrieveAllAmenities();
    IEnumerable<AmenityCategoryDto> RetrieveAmenitiesByCategory();
    ValueTask<Amenity?> RetrieveAmenityByIdAsync(Guid id);
    ValueTask<AmenityResponse> ModifyAmenityAsync(Guid id, AmenityCreateDto dto);
    ValueTask<bool> RemoveAmenityAsync(Guid id);

    ValueTask<IEnumerable<AmenityResponse>> RetrievePropertyAmenitiesAsync(Guid propertyId);
    ValueTask UpdatePropertyAmenitiesAsync(Guid propertyId, List<Guid> amenityIds);
    ValueTask<bool> PropertyHasAmenityAsync(Guid propertyId, Guid amenityId);

    ValueTask SeedDefaultAmenitiesAsync();
}
