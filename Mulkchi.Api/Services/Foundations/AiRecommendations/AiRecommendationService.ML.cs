using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Trainers;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Brokers.Storages;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Services.Foundations.AiRecommendations;

public partial class AiRecommendationService
{
    private const string ModelPath = "mlnet-recommendation-model.zip";
    private static MLContext? _mlContext;
    private static ITransformer? _model;
    private static DateTime _lastTrainingTime = DateTime.MinValue;
    private static readonly TimeSpan RetrainInterval = TimeSpan.FromHours(1);

    private class PropertyData
    {
        public float PropertyId { get; set; }
        public float UserId { get; set; }
        public float Score { get; set; }
        public float Price { get; set; }
        public float Bedrooms { get; set; }
        public float Bathrooms { get; set; }
        public float Area { get; set; }
        public float ViewsCount { get; set; }
        public float FavoritesCount { get; set; }
        public float Rating { get; set; }
        public string City { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    private class Prediction
    {
        public float Score { get; set; }
    }

    public async ValueTask<IEnumerable<PropertyResponse>> GetRecommendationsForUserAsync(Guid userId, int count = 5)
    {
        try
        {
            await TryTrainModelAsync();

            if (_model == null)
            {
                return await GetFallbackRecommendationsAsync(count);
            }

            var allProperties = await this.storageBroker.SelectAllProperties()
                .Where(p => p.Status == PropertyStatus.Active)
                .ToListAsync();

            if (allProperties.Count == 0)
            {
                return await GetFallbackRecommendationsAsync(count);
            }

            // Get predictions for all properties
            var predictionEngine = _mlContext.Model.CreatePredictionEngine<PropertyData, Prediction>(_model);
            var scoredProperties = new List<(Property Property, float Score)>();

            foreach (var property in allProperties)
            {
                var input = new PropertyData
                {
                    PropertyId = property.Id.GetHashCode(),
                    UserId = userId.GetHashCode(),
                    Price = (float)(GetPropertyPrice(property) ?? 0m),
                    Bedrooms = (float)property.NumberOfBedrooms,
                    Bathrooms = (float)property.NumberOfBathrooms,
                    Area = (float)property.Area,
                    ViewsCount = property.ViewsCount,
                    FavoritesCount = property.FavoritesCount,
                    Rating = (float)property.AverageRating,
                    City = property.City ?? "",
                    Type = property.Type.ToString()
                };

                var prediction = predictionEngine.Predict(input);
                scoredProperties.Add((property, prediction.Score));
            }

            // Return top recommendations
            var recommendations = scoredProperties
                .OrderByDescending(x => x.Score)
                .Take(count)
                .Select(x => x.Property)
                .ToList();

            if (recommendations.Count < count)
            {
                // Fill with fallback if needed
                var fallback = await GetFallbackRecommendationsAsync(count - recommendations.Count);
                recommendations.AddRange(fallback.Select(r => new Property
                {
                    Id = r.Id,
                    Title = r.Title,
                    Description = r.Description,
                    Type = r.Type,
                    Category = r.Category,
                    Status = r.Status,
                    ListingType = r.ListingType,
                    MonthlyRent = r.MonthlyRent,
                    SalePrice = r.SalePrice,
                    PricePerNight = r.PricePerNight,
                    SecurityDeposit = r.SecurityDeposit,
                    Area = r.Area,
                    NumberOfBedrooms = r.NumberOfBedrooms,
                    NumberOfBathrooms = r.NumberOfBathrooms,
                    MaxGuests = r.MaxGuests,
                    Region = r.Region,
                    City = r.City,
                    District = r.District,
                    Address = r.Address,
                    Mahalla = r.Mahalla,
                    ViewsCount = r.ViewsCount,
                    FavoritesCount = r.FavoritesCount,
                    AverageRating = r.AverageRating,
                    IsVerified = r.IsVerified,
                    IsFeatured = r.IsFeatured,
                    HostId = r.HostId,
                    Currency = r.Currency,
                    ExchangeRate = r.ExchangeRate,
                    CreatedDate = r.CreatedDate
                }));
            }

            return recommendations.Select(ToPropertyResponse);
        }
        catch (Exception)
        {
            // Log error and return fallback
            return await GetFallbackRecommendationsAsync(count);
        }
    }

    private async Task TryTrainModelAsync()
    {
        // Check if retraining is needed
        if (_model != null && DateTime.UtcNow - _lastTrainingTime < RetrainInterval)
        {
            return;
        }

        try
        {
            var properties = await this.storageBroker.SelectAllProperties()
                .Where(p => p.Status == PropertyStatus.Active)
                .Take(1000)
                .ToListAsync();

            if (properties.Count < 5)
            {
                // Not enough data for ML, use fallback algorithm
                _model = null;
                return;
            }

            var trainingData = properties.Select(p => new PropertyData
            {
                PropertyId = p.Id.GetHashCode(),
                UserId = 0, // Anonymous for now
                Score = CalculatePopularityScore(p),
                Price = (float)(p.MonthlyRent ?? 0),
                Bedrooms = (float)p.NumberOfBedrooms,
                Bathrooms = (float)p.NumberOfBathrooms,
                Area = (float)p.Area,
                ViewsCount = p.ViewsCount,
                FavoritesCount = p.FavoritesCount,
                Rating = (float)p.AverageRating,
                City = p.City ?? "",
                Type = p.Type.ToString()
            }).ToList();

            _mlContext = new MLContext(seed: 42);
            var dataView = _mlContext.Data.LoadFromEnumerable(trainingData);

            // Build pipeline
            var pipeline = _mlContext.Transforms.Categorical.OneHotEncoding(
                    outputColumnName: "CityEncoded", inputColumnName: nameof(PropertyData.City))
                .Append(_mlContext.Transforms.Categorical.OneHotEncoding(
                    outputColumnName: "TypeEncoded", inputColumnName: nameof(PropertyData.Type)))
                .Append(_mlContext.Transforms.Concatenate("Features",
                    nameof(PropertyData.Price),
                    nameof(PropertyData.Bedrooms),
                    nameof(PropertyData.Bathrooms),
                    nameof(PropertyData.Area),
                    nameof(PropertyData.ViewsCount),
                    nameof(PropertyData.FavoritesCount),
                    nameof(PropertyData.Rating),
                    "CityEncoded",
                    "TypeEncoded"))
                .Append(_mlContext.Recommendation().Trainers.MatrixFactorization(
                    matrixColumnIndexColumnName: nameof(PropertyData.PropertyId),
                    matrixRowIndexColumnName: nameof(PropertyData.UserId),
                    labelColumnName: nameof(PropertyData.Score),
                    numberOfIterations: 20,
                    approximationRank: 100));

            _model = pipeline.Fit(dataView);
            _lastTrainingTime = DateTime.UtcNow;

            // Save model
            await Task.Run(() => _mlContext.Model.Save(_model, dataView.Schema, ModelPath));
        }
        catch
        {
            // ML training failed, will use fallback
            _model = null;
        }
    }

    private async ValueTask<IEnumerable<PropertyResponse>> GetFallbackRecommendationsAsync(int count)
    {
        // Return top-rated and most-viewed properties as fallback
        var properties = await this.storageBroker.SelectAllProperties()
            .Where(p => p.Status == PropertyStatus.Active)
            .OrderByDescending(p => p.AverageRating)
            .ThenByDescending(p => p.ViewsCount)
            .ThenByDescending(p => p.FavoritesCount)
            .Take(count)
            .ToListAsync();

        if (properties.Count < count)
        {
            // If not enough rated properties, fill with newest
            var additional = await this.storageBroker.SelectAllProperties()
                .Where(p => p.Status == PropertyStatus.Active && !properties.Select(x => x.Id).Contains(p.Id))
                .OrderByDescending(p => p.CreatedDate)
                .Take(count - properties.Count)
                .ToListAsync();

            properties.AddRange(additional);
        }

        if (properties.Count < count)
        {
            // Last resort: return any active properties
            var anyActive = await this.storageBroker.SelectAllProperties()
                .Where(p => !properties.Select(x => x.Id).Contains(p.Id))
                .Take(count - properties.Count)
                .ToListAsync();

            properties.AddRange(anyActive);
        }

        return properties.Select(ToPropertyResponse);
    }

    private float CalculatePopularityScore(Property property)
    {
        // Weighted scoring based on views, favorites, and rating
        float score = 0;
        score += Math.Min(property.ViewsCount / 100f, 5f); // Max 5 points from views
        score += Math.Min(property.FavoritesCount * 2, 5f); // Max 5 points from favorites
        score += (float)property.AverageRating * 2; // Max 10 points from rating
        score += property.IsVerified ? 2 : 0; // 2 points for verified
        score += property.IsFeatured ? 3 : 0; // 3 points for featured
        return score;
    }

    private decimal? GetPropertyPrice(Property property)
    {
        return property.MonthlyRent ?? property.SalePrice ?? property.PricePerNight ?? property.SecurityDeposit;
    }

    private PropertyResponse ToPropertyResponse(Property p)
    {
        return new PropertyResponse
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Type = p.Type,
            Category = p.Category,
            Status = p.Status,
            ListingType = p.ListingType,
            MonthlyRent = p.MonthlyRent,
            SalePrice = p.SalePrice,
            PricePerNight = p.PricePerNight,
            SecurityDeposit = p.SecurityDeposit,
            Area = p.Area,
            NumberOfBedrooms = p.NumberOfBedrooms,
            NumberOfBathrooms = p.NumberOfBathrooms,
            MaxGuests = p.MaxGuests,
            Region = p.Region,
            City = p.City,
            District = p.District,
            Address = p.Address,
            Mahalla = p.Mahalla,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            HasWifi = p.HasWifi,
            HasParking = p.HasParking,
            HasPool = p.HasPool,
            PetsAllowed = p.PetsAllowed,
            IsInstantBook = p.IsInstantBook,
            IsVacant = p.IsVacant,
            IsFeatured = p.IsFeatured,
            IsVerified = p.IsVerified,
            HasMetroNearby = p.HasMetroNearby,
            HasBusStop = p.HasBusStop,
            HasMarketNearby = p.HasMarketNearby,
            HasSchoolNearby = p.HasSchoolNearby,
            HasHospitalNearby = p.HasHospitalNearby,
            DistanceToCityCenter = p.DistanceToCityCenter,
            HasElevator = p.HasElevator,
            HasSecurity = p.HasSecurity,
            HasGenerator = p.HasGenerator,
            HasGas = p.HasGas,
            HasFurniture = p.HasFurniture,
            IsRenovated = p.IsRenovated,
            HasAirConditioning = p.HasAirConditioning,
            HasHeating = p.HasHeating,
            HasWasher = p.HasWasher,
            HasKitchen = p.HasKitchen,
            HasTV = p.HasTV,
            HasWorkspace = p.HasWorkspace,
            IsSelfCheckIn = p.IsSelfCheckIn,
            IsChildFriendly = p.IsChildFriendly,
            IsAccessible = p.IsAccessible,
            AverageRating = p.AverageRating,
            ViewsCount = p.ViewsCount,
            FavoritesCount = p.FavoritesCount,
            HostId = p.HostId,
            Currency = p.Currency,
            ExchangeRate = p.ExchangeRate,
            CreatedDate = p.CreatedDate,
            UpdatedDate = p.UpdatedDate,
            DeletedDate = p.DeletedDate
        };
    }
}
