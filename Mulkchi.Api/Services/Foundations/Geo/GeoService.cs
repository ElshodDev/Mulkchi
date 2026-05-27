using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Geo;
using Mulkchi.Api.Models.Foundations.Properties;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Mulkchi.Api.Services.Foundations.Geo;

public class GeoService : IGeoService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly HttpClient httpClient;

    public GeoService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IHttpClientFactory httpClientFactory)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.httpClient = httpClientFactory.CreateClient("OpenStreetMap");
        this.httpClient.BaseAddress = new Uri("https://overpass-api.de/api/");
        this.httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    public async Task<IEnumerable<NearbyPlaceDto>> GetNearbyPlacesAsync(double lat, double lng, string placeType, double radiusKm = 5)
    {
        var query = BuildOverpassQuery(lat, lng, placeType, radiusKm);
        var content = new StringContent(query);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-www-form-urlencoded");

        try
        {
            var response = await this.httpClient.PostAsync("interpreter", content);
            if (!response.IsSuccessStatusCode)
            {
                this.loggingBroker.LogError(new Exception($"OpenStreetMap API error: {response.StatusCode}"));
                return Enumerable.Empty<NearbyPlaceDto>();
            }

            var json = await response.Content.ReadAsStringAsync();
            var places = ParseOverpassResponse(json, lat, lng);
            return places;
        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(new Exception($"Error fetching nearby places: {ex.Message}", ex));
            return Enumerable.Empty<NearbyPlaceDto>();
        }
    }

    public async Task<IEnumerable<PropertyMapDto>> GetPropertiesByLocationAsync(double lat, double lng, double radiusKm)
    {
        var properties = await this.storageBroker.SelectAllProperties()
            .Where(p => p.Latitude.HasValue && p.Longitude.HasValue && p.Status == PropertyStatus.Active)
            .ToListAsync();

        var nearbyProperties = properties
            .Select(p => new
            {
                Property = p,
                Distance = CalculateDistance(lat, lng, p.Latitude!.Value, p.Longitude!.Value)
            })
            .Where(x => x.Distance <= radiusKm)
            .OrderBy(x => x.Distance)
            .Select(x => ToPropertyMapDto(x.Property, x.Distance));

        return nearbyProperties;
    }

    public async Task<IEnumerable<PropertyMapDto>> GetAllPropertiesForMapAsync()
    {
        var properties = await this.storageBroker.SelectAllProperties()
            .Where(p => p.Latitude.HasValue && p.Longitude.HasValue && p.Status == PropertyStatus.Active)
            .OrderByDescending(p => p.CreatedDate)
            .Take(500)
            .ToListAsync();

        return properties.Select(p => ToPropertyMapDto(p, null));
    }

    private static string BuildOverpassQuery(double lat, double lng, string placeType, double radiusKm)
    {
        var radiusMeters = (int)(radiusKm * 1000);
        var tags = placeType.ToLower() switch
        {
            "metro" or "subway" => "[\"station\"][\"subway\"]",
            "park" => "[\"leisure\"=\"park\"]",
            "school" => "[\"amenity\"=\"school\"]",
            "shop" or "supermarket" => "[\"shop\"=\"supermarket\"]",
            "restaurant" => "[\"amenity\"=\"restaurant\"]",
            "hospital" => "[\"amenity\"=\"hospital\"]",
            "pharmacy" => "[\"amenity\"=\"pharmacy\"]",
            "bank" => "[\"amenity\"=\"bank\"]",
            _ => "[\"name\"]"
        };

        return $"[out:json][timeout:25];\n" +
               $"(\n" +
               $"  node{tags}(around:{radiusMeters},{lat},{lng});\n" +
               $"  way{tags}(around:{radiusMeters},{lat},{lng});\n" +
               $"  relation{tags}(around:{radiusMeters},{lat},{lng});\n" +
               $");\n" +
               $"out body center;";
    }

    private IEnumerable<NearbyPlaceDto> ParseOverpassResponse(string json, double userLat, double userLng)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var elements = root.GetProperty("elements");

            var places = new List<NearbyPlaceDto>();

            foreach (var element in elements.EnumerateArray())
            {
                var type = element.GetProperty("type").GetString();
                var tags = element.GetProperty("tags");

                double placeLat, placeLng;

                if (type == "node")
                {
                    placeLat = element.GetProperty("lat").GetDouble();
                    placeLng = element.GetProperty("lon").GetDouble();
                }
                else
                {
                    var center = element.GetProperty("center");
                    placeLat = center.GetProperty("lat").GetDouble();
                    placeLng = center.GetProperty("lon").GetDouble();
                }

                var name = tags.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                if (string.IsNullOrWhiteSpace(name))
                    continue;

                var placeType = GetPlaceTypeFromTags(tags);
                var distance = CalculateDistance(userLat, userLng, placeLat, placeLng);

                places.Add(new NearbyPlaceDto
                {
                    Name = name,
                    Type = placeType,
                    Latitude = placeLat,
                    Longitude = placeLng,
                    DistanceKm = Math.Round(distance, 2),
                    Address = GetAddressFromTags(tags),
                    OsmId = element.GetProperty("id").ToString()
                });
            }

            return places.OrderBy(p => p.DistanceKm).Take(20);
        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(new Exception($"Error parsing Overpass response: {ex.Message}", ex));
            return Enumerable.Empty<NearbyPlaceDto>();
        }
    }

    private static string GetPlaceTypeFromTags(JsonElement tags)
    {
        if (tags.TryGetProperty("station", out _) && tags.TryGetProperty("subway", out _))
            return "metro";
        if (tags.TryGetProperty("leisure", out var leisure) && leisure.GetString() == "park")
            return "park";
        if (tags.TryGetProperty("amenity", out var amenity))
        {
            var value = amenity.GetString();
            if (value == "school") return "school";
            if (value == "restaurant") return "restaurant";
            if (value == "hospital") return "hospital";
            if (value == "pharmacy") return "pharmacy";
            if (value == "bank") return "bank";
        }
        if (tags.TryGetProperty("shop", out var shop) && shop.GetString() == "supermarket")
            return "supermarket";

        return "other";
    }

    private static string? GetAddressFromTags(JsonElement tags)
    {
        var parts = new List<string>();

        if (tags.TryGetProperty("addr:street", out var street))
            parts.Add(street.GetString()!);
        if (tags.TryGetProperty("addr:housenumber", out var house))
            parts.Add(house.GetString()!);

        return parts.Count > 0 ? string.Join(", ", parts) : null;
    }

    private static PropertyMapDto ToPropertyMapDto(Models.Foundations.Properties.Property p, double? distance)
    {
        var price = p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight ?? 0;

        return new PropertyMapDto
        {
            Id = p.Id,
            Title = p.Title,
            Latitude = p.Latitude!.Value,
            Longitude = p.Longitude!.Value,
            City = p.City,
            District = p.District,
            Price = price,
            ListingType = p.ListingType.ToString(),
            NumberOfBedrooms = p.NumberOfBedrooms,
            Area = p.Area
        };
    }
}
