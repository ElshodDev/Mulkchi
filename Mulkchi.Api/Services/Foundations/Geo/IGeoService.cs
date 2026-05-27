using Mulkchi.Api.Models.Foundations.Geo;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.Geo;

public interface IGeoService
{
    double CalculateDistance(double lat1, double lon1, double lat2, double lon2);
    Task<IEnumerable<NearbyPlaceDto>> GetNearbyPlacesAsync(double lat, double lng, string placeType, double radiusKm = 5);
    Task<IEnumerable<PropertyMapDto>> GetPropertiesByLocationAsync(double lat, double lng, double radiusKm);
    Task<IEnumerable<PropertyMapDto>> GetAllPropertiesForMapAsync();
}
