using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.AIs;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Properties.Extensions;

namespace Mulkchi.Api.Services.Foundations.AiRecommendations;

public partial class AiRecommendationService
{
    public ValueTask<IEnumerable<HybridRecommendationResponse>> RetrieveHybridRecommendationsAsync(HybridRecommendationRequest request)
    {
        request ??= new HybridRecommendationRequest();

        int limit = request.Limit <= 0 ? 10 : Math.Min(request.Limit, 50);
        double radiusKm = request.RadiusKm <= 0 ? 10 : request.RadiusKm;
        Guid? userId = request.UserId;

        var candidateProperties = this.storageBroker.SelectAllProperties()
            .Where(p => p.IsVacant)
            .ToList();

        if (candidateProperties.Count == 0)
        {
            return ValueTask.FromResult<IEnumerable<HybridRecommendationResponse>>(Enumerable.Empty<HybridRecommendationResponse>());
        }

        var propertyImages = this.storageBroker.SelectAllPropertyImages()
            .ToList();

        var imageLookup = propertyImages
            .GroupBy(i => i.PropertyId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.IsPrimary).ThenBy(x => x.SortOrder).Select(x => x.Url).ToList());

        var favoritePropertyIds = new HashSet<Guid>();
        var viewedPropertyIds = new HashSet<Guid>();
        var collaborativePropertyIds = new HashSet<Guid>();

        if (userId.HasValue)
        {
            favoritePropertyIds = this.storageBroker.SelectAllFavorites()
                .Where(f => f.UserId == userId.Value)
                .Select(f => f.PropertyId)
                .ToHashSet();

            viewedPropertyIds = this.storageBroker.SelectAllPropertyViews()
                .Where(v => v.UserId == userId.Value)
                .Select(v => v.PropertyId)
                .ToHashSet();

            var overlapUsers = this.storageBroker.SelectAllFavorites()
                .Where(f => favoritePropertyIds.Contains(f.PropertyId) && f.UserId != userId.Value)
                .Select(f => f.UserId)
                .Distinct()
                .ToHashSet();

            if (overlapUsers.Count > 0)
            {
                collaborativePropertyIds = this.storageBroker.SelectAllFavorites()
                    .Where(f => overlapUsers.Contains(f.UserId))
                    .Select(f => f.PropertyId)
                    .ToHashSet();
            }
        }

        var seenPropertyIds = new HashSet<Guid>(favoritePropertyIds);
        foreach (var viewedPropertyId in viewedPropertyIds)
        {
            seenPropertyIds.Add(viewedPropertyId);
        }

        var preferenceProperties = candidateProperties
            .Where(p => favoritePropertyIds.Contains(p.Id) || viewedPropertyIds.Contains(p.Id))
            .ToList();

        decimal preferredPrice = preferenceProperties
            .Select(GetPrimaryPrice)
            .Where(p => p > 0)
            .DefaultIfEmpty(0)
            .Average();

        double preferredBedrooms = preferenceProperties
            .Select(p => (double)p.NumberOfBedrooms)
            .DefaultIfEmpty(0)
            .Average();

        var preferredTypes = preferenceProperties
            .GroupBy(p => p.Type)
            .OrderByDescending(g => g.Count())
            .Take(2)
            .Select(g => g.Key)
            .ToHashSet();

        var ranked = candidateProperties
            .Where(p => !seenPropertyIds.Contains(p.Id))
            .Select(property =>
            {
                double distanceScore = CalculateDistanceScore(property, request.Latitude, request.Longitude, radiusKm);
                double priceScore = CalculatePriceScore(property, preferredPrice);
                double roomsScore = CalculateRoomsScore(property, preferredBedrooms);
                double typeScore = CalculateTypeScore(property, preferredTypes);
                double featureScore = CalculateFeatureScore(property, preferenceProperties);

                double weightedScore =
                    (distanceScore * 0.35) +
                    (priceScore * 0.25) +
                    (roomsScore * 0.20) +
                    (typeScore * 0.15) +
                    (featureScore * 0.05);

                bool collaborativeMatch = collaborativePropertyIds.Contains(property.Id);

                return new
                {
                    Property = property,
                    Score = Math.Round((decimal)Math.Clamp(weightedScore, 0.0, 1.0), 4),
                    Collaborative = collaborativeMatch,
                    DistanceKm = request.Latitude.HasValue && request.Longitude.HasValue && property.Latitude.HasValue && property.Longitude.HasValue
                        ? PropertyGeoExtensions.DistanceKm(
                            request.Latitude.Value,
                            request.Longitude.Value,
                            property.Latitude.Value,
                            property.Longitude.Value)
                        : (double?)null,
                    DistanceScore = distanceScore,
                    PriceScore = priceScore,
                    RoomsScore = roomsScore,
                    TypeScore = typeScore
                };
            })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Property.AverageRating)
            .Take(limit)
            .ToList();

        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();

        IEnumerable<HybridRecommendationResponse> recommendations = ranked.Select((x, index) =>
        {
            imageLookup.TryGetValue(x.Property.Id, out List<string>? images);
            images ??= new List<string>();

            string reason = BuildReason(x.DistanceScore, x.PriceScore, x.RoomsScore, x.TypeScore, x.Collaborative);

            return new HybridRecommendationResponse
            {
                Id = $"hybrid-{x.Property.Id}-{index}",
                UserId = userId,
                PropertyId = x.Property.Id,
                RecommendationType = x.Collaborative ? "PreferenceBased" : "PopularInArea",
                AbVariant = ResolveAbVariant(x.Property.Id, userId),
                Score = x.Score,
                Reason = reason,
                CreatedAt = now,
                IsViewed = false,
                IsClicked = false,
                Property = new HybridRecommendationProperty
                {
                    Id = x.Property.Id,
                    Title = x.Property.Title,
                    Description = x.Property.Description,
                    Price = GetPrimaryPrice(x.Property),
                    Address = x.Property.Address,
                    City = x.Property.City,
                    Region = x.Property.Region.ToString(),
                    PropertyType = x.Property.Type.ToString(),
                    ListingType = x.Property.ListingType.ToString(),
                    Area = x.Property.Area,
                    RoomsCount = x.Property.NumberOfBedrooms,
                    BathroomsCount = x.Property.NumberOfBathrooms,
                    ImageUrl = images.FirstOrDefault() ?? string.Empty,
                    Images = images,
                    HostId = x.Property.HostId,
                    HostName = string.Empty,
                    Rating = x.Property.AverageRating,
                    ReviewsCount = 0,
                    ViewsCount = x.Property.ViewsCount,
                    DistanceKm = x.DistanceKm,
                    IsFeatured = x.Property.IsFeatured,
                    IsVerified = x.Property.IsVerified
                }
            };
        }).ToList();

        return ValueTask.FromResult(recommendations);
    }

    private static decimal GetPrimaryPrice(Property property) =>
        property.SalePrice ?? property.MonthlyRent ?? property.PricePerNight ?? 0m;

    private static double CalculateDistanceScore(Property property, double? latitude, double? longitude, double radiusKm)
    {
        if (!latitude.HasValue || !longitude.HasValue || !property.Latitude.HasValue || !property.Longitude.HasValue)
        {
            return 0.5;
        }

        double distance = PropertyGeoExtensions.DistanceKm(
            latitude.Value,
            longitude.Value,
            property.Latitude.Value,
            property.Longitude.Value);

        return Math.Clamp(1.0 - (distance / radiusKm), 0.0, 1.0);
    }

    private static double CalculatePriceScore(Property property, decimal preferredPrice)
    {
        decimal price = GetPrimaryPrice(property);
        if (price <= 0 || preferredPrice <= 0)
        {
            return 0.5;
        }

        decimal diffRatio = Math.Abs(price - preferredPrice) / preferredPrice;
        return Math.Clamp(1.0 - (double)diffRatio, 0.0, 1.0);
    }

    private static double CalculateRoomsScore(Property property, double preferredBedrooms)
    {
        if (preferredBedrooms <= 0)
        {
            return 0.5;
        }

        double diff = Math.Abs(property.NumberOfBedrooms - preferredBedrooms);
        return Math.Clamp(1.0 - (diff / 5.0), 0.0, 1.0);
    }

    private static double CalculateTypeScore(Property property, HashSet<PropertyType> preferredTypes)
    {
        if (preferredTypes.Count == 0)
        {
            return 0.5;
        }

        return preferredTypes.Contains(property.Type) ? 1.0 : 0.0;
    }

    private static double CalculateFeatureScore(Property property, List<Property> preferenceProperties)
    {
        if (preferenceProperties.Count == 0)
        {
            return 0.5;
        }

        var pairs = new[]
        {
            (property.HasWifi, preferenceProperties.Count(p => p.HasWifi) >= preferenceProperties.Count / 2.0),
            (property.HasParking, preferenceProperties.Count(p => p.HasParking) >= preferenceProperties.Count / 2.0),
            (property.HasPool, preferenceProperties.Count(p => p.HasPool) >= preferenceProperties.Count / 2.0),
            (property.HasMetroNearby, preferenceProperties.Count(p => p.HasMetroNearby) >= preferenceProperties.Count / 2.0),
            (property.HasMarketNearby, preferenceProperties.Count(p => p.HasMarketNearby) >= preferenceProperties.Count / 2.0),
            (property.HasSchoolNearby, preferenceProperties.Count(p => p.HasSchoolNearby) >= preferenceProperties.Count / 2.0),
            (property.HasHospitalNearby, preferenceProperties.Count(p => p.HasHospitalNearby) >= preferenceProperties.Count / 2.0),
            (property.IsRenovated, preferenceProperties.Count(p => p.IsRenovated) >= preferenceProperties.Count / 2.0),
            (property.HasElevator, preferenceProperties.Count(p => p.HasElevator) >= preferenceProperties.Count / 2.0)
        };

        int matches = pairs.Count(p => p.Item1 == p.Item2);
        return Math.Clamp(matches / (double)pairs.Length, 0.0, 1.0);
    }

    private static string BuildReason(
        double distanceScore,
        double priceScore,
        double roomsScore,
        double typeScore,
        bool collaborative)
    {
        var reasons = new List<string>();

        if (distanceScore >= 0.7) reasons.Add("joylashuv yaqin");
        if (priceScore >= 0.7) reasons.Add("narx diapazoni mos");
        if (roomsScore >= 0.7) reasons.Add("xona soni mos");
        if (typeScore >= 0.7) reasons.Add("mulk turi mos");
        if (collaborative) reasons.Add("o'xshash foydalanuvchilar tanlovi");

        if (reasons.Count == 0)
        {
            return "Gibrid model asosida tavsiya";
        }

        return "Tavsiya sababi: " + string.Join(", ", reasons.Take(3));
    }

    private static string ResolveAbVariant(Guid propertyId, Guid? userId)
    {
        Guid stableUserId = userId ?? Guid.Empty;
        int hash = HashCode.Combine(propertyId, stableUserId);
        return Math.Abs(hash) % 2 == 0 ? "A" : "B";
    }

}
