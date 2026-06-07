using Microsoft.EntityFrameworkCore;
using Microsoft.ML;
using Microsoft.ML.Data;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Models.Foundations.Properties;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Services.Foundations.AI;

public class PriceRecommendationService : IPriceRecommendationService
{
    private readonly StorageBroker storageBroker;
    private readonly ILogger<PriceRecommendationService> logger;
    private readonly MLContext mlContext;
    private ITransformer? model;
    private PredictionEngine<PropertyPriceInput, PropertyPricePrediction>? predictionEngine;
    private readonly object modelLock = new object();
    private DateTime lastTrainedAt = DateTime.MinValue;
    private const int MIN_TRAINING_DATA = 10;
    private const int RETRAIN_THRESHOLD = 50;

    public PriceRecommendationService(StorageBroker storageBroker, ILogger<PriceRecommendationService> logger)
    {
        this.storageBroker = storageBroker;
        this.logger = logger;
        this.mlContext = new MLContext(seed: 0);
    }

    public async Task<PriceRecommendationResponse> PredictPriceAsync(PriceRecommendationRequest request)
    {
        lock (modelLock)
        {
            if (model == null || predictionEngine == null)
            {
                return GetRuleBasedPrediction(request);
            }
        }

        var input = new PropertyPriceInput
        {
            Area = request.Area,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            Region = request.Region,
            HasWifi = request.HasWifi ? 1f : 0f,
            HasParking = request.HasParking ? 1f : 0f,
            HasPool = request.HasPool ? 1f : 0f,
            IsRenovated = request.IsRenovated ? 1f : 0f,
            HasElevator = request.HasElevator ? 1f : 0f,
            DistanceToCityCenter = request.DistanceToCityCenter,
            ListingType = request.ListingType == ListingType.Rent ? 1f : (request.ListingType == ListingType.ShortTermRent ? 2f : 0f),
            BuildingType = request.BuildingType == BuildingType.NewBuilding ? 1f : 0f,
            RenovationLevel = (float)request.RenovationLevel,
            District = request.District ?? string.Empty,
            DescriptionText = request.DescriptionText ?? string.Empty
        };

        var prediction = predictionEngine!.Predict(input);
        var predictedPrice = (decimal)prediction.PredictedPrice;

        // Smart Pricing Modifiers
        predictedPrice = ApplyDynamicPricing(predictedPrice, request.ListingType);

        var trainingDataCount = await GetTrainingDataCountAsync();
        var confidence = GetConfidenceLevel(trainingDataCount, predictedPrice);

        return new PriceRecommendationResponse
        {
            PredictedPrice = predictedPrice,
            Currency = "USD",
            Confidence = confidence,
            PriceRange = CalculatePriceRange(predictedPrice, confidence),
            BasedOnProperties = trainingDataCount,
            Recommendation = GenerateRecommendation(predictedPrice, confidence),
            IsRuleBased = false
        };
    }

    private decimal ApplyDynamicPricing(decimal basePrice, ListingType listingType)
    {
        // Only apply dynamic pricing to ShortTermRent (Daily Rent)
        if (listingType != ListingType.ShortTermRent) return basePrice;

        var now = DateTime.UtcNow;
        var multiplier = 1.0m;

        // Weekend Surge Pricing
        if (now.DayOfWeek == DayOfWeek.Friday || now.DayOfWeek == DayOfWeek.Saturday)
        {
            multiplier *= 1.15m; // +15% on weekends
        }

        // Seasonality Surge (Summer: June, July, August)
        if (now.Month >= 6 && now.Month <= 8)
        {
            multiplier *= 1.10m; // +10% in summer
        }

        // Seasonality Drop (Winter: Jan, Feb)
        if (now.Month == 1 || now.Month == 2)
        {
            multiplier *= 0.90m; // -10% in deep winter
        }

        return basePrice * multiplier;
    }

    private decimal GetDistrictWeight(string? district, int region)
    {
        if (region != 0 || string.IsNullOrWhiteSpace(district)) return 1.0m;

        var d = district.ToLowerInvariant();
        if (d.Contains("mirabod") || d.Contains("mirobod") || d.Contains("yakkasaroy") || d.Contains("shayxontohur")) return 1.3m;
        if (d.Contains("yunusobod") || d.Contains("yashnobod")) return 1.1m;
        if (d.Contains("chilonzor") || d.Contains("uchtepa")) return 1.0m;
        if (d.Contains("olmazor") || d.Contains("sergeli")) return 0.8m;
        if (d.Contains("bektemir") || d.Contains("yangihayot")) return 0.7m;

        return 1.0m;
    }

    public async Task TrainModelAsync()
    {
        try
        {
            var properties = await GetTrainingDataAsync();

            if (properties.Count < MIN_TRAINING_DATA)
            {
                return;
            }

            var trainingData = ConvertToTrainingData(properties);
            var pipeline = BuildTrainingPipeline();

            model = pipeline.Fit(trainingData);
            predictionEngine = mlContext.Model.CreatePredictionEngine<PropertyPriceInput, PropertyPricePrediction>(model);

            lastTrainedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            this.logger.LogWarning(ex, "Error training ML model");
        }
    }

    public async Task<bool> IsModelTrainedAsync()
    {
        if (model == null || predictionEngine == null)
        {
            await TrainModelAsync();
        }

        return model != null && predictionEngine != null;
    }

    public async Task<int> GetTrainingDataCountAsync()
    {
        var properties = await storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue &&
                       ((p.SalePrice.HasValue && p.SalePrice > 0) || 
                        (p.MonthlyRent.HasValue && p.MonthlyRent > 0) ||
                        (p.PricePerNight.HasValue && p.PricePerNight > 0)) &&
                       p.Area > 0)
            .ToListAsync();

        return properties.Count;
    }

    private async Task<List<Property>> GetTrainingDataAsync()
    {
        return await storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue &&
                       ((p.SalePrice.HasValue && p.SalePrice > 0) || 
                        (p.MonthlyRent.HasValue && p.MonthlyRent > 0) ||
                        (p.PricePerNight.HasValue && p.PricePerNight > 0)) &&
                       p.Area > 0 &&
                       p.NumberOfBedrooms > 0 &&
                       p.NumberOfBathrooms > 0)
            .ToListAsync();
    }

    private IDataView ConvertToTrainingData(List<Property> properties)
    {
        var trainingData = properties.Select(p => new PropertyPriceInput
        {
            Area = (float)p.Area,
            Bedrooms = (float)p.NumberOfBedrooms,
            Bathrooms = (float)p.NumberOfBathrooms,
            Region = (float)(int)p.Region,
            HasWifi = p.HasWifi ? 1f : 0f,
            HasParking = p.HasParking ? 1f : 0f,
            HasPool = p.HasPool ? 1f : 0f,
            IsRenovated = p.IsRenovated ? 1f : 0f,
            HasElevator = p.HasElevator ? 1f : 0f,
            DistanceToCityCenter = (float)p.DistanceToCityCenter,
            ListingType = p.ListingType == ListingType.Rent ? 1f : (p.ListingType == ListingType.ShortTermRent ? 2f : 0f),
            BuildingType = p.BuildingType == BuildingType.NewBuilding ? 1f : 0f,
            RenovationLevel = (float)p.RenovationLevel,
            District = p.District ?? string.Empty,
            DescriptionText = (p.Title + " " + p.Description) ?? string.Empty,
            Label = (float)(
                p.ListingType == ListingType.Rent ? p.MonthlyRent.GetValueOrDefault() :
                p.ListingType == ListingType.ShortTermRent ? p.PricePerNight.GetValueOrDefault() :
                p.SalePrice.GetValueOrDefault()
            )
        });

        return mlContext.Data.LoadFromEnumerable(trainingData);
    }

    private IEstimator<ITransformer> BuildTrainingPipeline()
    {
        var pipeline = mlContext.Transforms.Concatenate(
            "Features",
            nameof(PropertyPriceInput.Area),
            nameof(PropertyPriceInput.Bedrooms),
            nameof(PropertyPriceInput.Bathrooms),
            nameof(PropertyPriceInput.Region),
            nameof(PropertyPriceInput.HasWifi),
            nameof(PropertyPriceInput.HasParking),
            nameof(PropertyPriceInput.HasPool),
            nameof(PropertyPriceInput.IsRenovated),
            nameof(PropertyPriceInput.HasElevator),
            nameof(PropertyPriceInput.DistanceToCityCenter),
            nameof(PropertyPriceInput.ListingType),
            nameof(PropertyPriceInput.BuildingType),
            nameof(PropertyPriceInput.RenovationLevel)
        )
        .Append(mlContext.Transforms.Text.FeaturizeText("TextFeatures", nameof(PropertyPriceInput.DescriptionText)))
        .Append(mlContext.Transforms.Categorical.OneHotEncoding("DistrictEncoded", nameof(PropertyPriceInput.District)))
        .Append(mlContext.Transforms.Concatenate("Features", "Features", "TextFeatures", "DistrictEncoded"))
        .Append(mlContext.Regression.Trainers.FastTree(
            numberOfLeaves: 20,
            numberOfTrees: 100,
            minimumExampleCountPerLeaf: 5
        ));

        return pipeline;
    }

    private PriceRecommendationResponse GetRuleBasedPrediction(PriceRecommendationRequest request)
    {
        var basePricePerSqm = GetBasePriceByRegion(request.Region, request.ListingType);

        var basePrice = (decimal)request.Area * basePricePerSqm;

        var multiplier = 1.0m;

        if (request.Bedrooms >= 3) multiplier *= 1.1m;
        else if (request.Bedrooms == 1) multiplier *= 0.9m;

        if (request.Bathrooms >= 2) multiplier *= 1.05m;

        if (request.HasWifi) multiplier *= 1.02m;
        if (request.HasParking) multiplier *= 1.08m;
        if (request.HasPool) multiplier *= 1.15m;
        if (request.HasElevator) multiplier *= 1.03m;

        // Building Type & Renovation Multipliers
        if (request.BuildingType == BuildingType.NewBuilding) multiplier *= 1.25m; // Novostroyka qimmatroq
        
        multiplier *= request.RenovationLevel switch
        {
            RenovationLevel.ShellAndCore => 0.7m, // Korobka
            RenovationLevel.Average => 1.0m,      // O'rtacha
            RenovationLevel.EuroLux => 1.25m,     // Yevro
            _ => 1.0m
        };

        // District Weight
        multiplier *= GetDistrictWeight(request.District, request.Region);

        if (request.DistanceToCityCenter > 0 && request.DistanceToCityCenter < 2) multiplier *= 1.1m;
        else if (request.DistanceToCityCenter > 10) multiplier *= 0.95m;

        var predictedPrice = basePrice * multiplier;

        // Smart Pricing for Rule-Based
        predictedPrice = ApplyDynamicPricing(predictedPrice, request.ListingType);

        return new PriceRecommendationResponse
        {
            PredictedPrice = Math.Round(predictedPrice, 2),
            Currency = "USD",
            Confidence = "Low",
            PriceRange = CalculatePriceRange(predictedPrice, "Low"),
            BasedOnProperties = 0,
            Recommendation = GenerateRecommendation(predictedPrice, "Low"),
            IsRuleBased = true
        };
    }

    private decimal GetBasePriceByRegion(int region, ListingType listingType)
    {
        if (listingType == ListingType.Rent) 
        {
            return region switch
            {
                0 => 8m, // Toshkent shahar $8 per sqm rent (O'rtacha)
                1 => 5m,
                2 => 4.5m,
                _ => 3m
            };
        }

        if (listingType == ListingType.ShortTermRent)
        {
            return region switch
            {
                0 => 0.5m, // Toshkent shahar $0.5 per sqm per night
                1 => 0.3m,
                2 => 0.25m,
                _ => 0.2m
            };
        }

        return region switch
        {
            0 => 800m,
            1 => 600m,
            2 => 550m,
            3 => 500m,
            4 => 450m,
            5 => 400m,
            6 => 350m,
            _ => 500m
        };
    }

    private string GetConfidenceLevel(int trainingDataCount, decimal predictedPrice)
    {
        if (trainingDataCount < 20) return "Low";
        if (trainingDataCount < 50) return "Medium";
        if (trainingDataCount < 100) return "High";
        return "Very High";
    }

    private PriceRange CalculatePriceRange(decimal predictedPrice, string confidence)
    {
        var variance = confidence switch
        {
            "Low" => 0.20m,
            "Medium" => 0.15m,
            "High" => 0.10m,
            "Very High" => 0.05m,
            _ => 0.20m
        };

        return new PriceRange
        {
            Min = Math.Round(predictedPrice * (1 - variance), 2),
            Max = Math.Round(predictedPrice * (1 + variance), 2)
        };
    }

    private string GenerateRecommendation(decimal predictedPrice, string confidence)
    {
        var priceRange = CalculatePriceRange(predictedPrice, confidence);

        return confidence switch
        {
            "Low" => $"Bu hudud uchun taxminiy narx ${priceRange.Min:N0} - ${priceRange.Max:N0} oralig'ida (kam ma'lumot asosida)",
            "Medium" => $"Bu hudud uchun o'rtacha narx ${priceRange.Min:N0} - ${priceRange.Max:N0} oralig'ida",
            "High" => $"Bu xususiyatlar uchun narx ${priceRange.Min:N0} - ${priceRange.Max:N0} oralig'ida (yuqori ishonch)",
            "Very High" => $"Aniq narx taxmini: ${predictedPrice:N0} ± {((priceRange.Max - priceRange.Min) / 2):N0}",
            _ => $"Narx taxmini: ${priceRange.Min:N0} - ${priceRange.Max:N0}"
        };
    }
}
