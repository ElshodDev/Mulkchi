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
            DistanceToCityCenter = request.DistanceToCityCenter
        };

        var prediction = predictionEngine!.Predict(input);
        var predictedPrice = (decimal)prediction.PredictedPrice;

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

    public async Task TrainModelAsync()
    {
        try
        {
            var properties = await GetTrainingDataAsync();
            
            if (properties.Count < MIN_TRAINING_DATA)
            {
                return; // Not enough data for training
            }

            var trainingData = ConvertToTrainingData(properties);
            var pipeline = BuildTrainingPipeline();
            
            model = pipeline.Fit(trainingData);
            predictionEngine = mlContext.Model.CreatePredictionEngine<PropertyPriceInput, PropertyPricePrediction>(model);
            
            lastTrainedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            // Log error but don't throw - service should still work with rule-based predictions
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
                       p.SalePrice.HasValue && 
                       p.SalePrice > 0 &&
                       p.Area > 0)
            .ToListAsync();

        return properties.Count;
    }

    private async Task<List<Property>> GetTrainingDataAsync()
    {
        return await storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && 
                       p.SalePrice.HasValue && 
                       p.SalePrice > 0 &&
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
            Label = (float)p.SalePrice.GetValueOrDefault()
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
            nameof(PropertyPriceInput.DistanceToCityCenter)
        )
        .Append(mlContext.Regression.Trainers.FastTree(
            numberOfLeaves: 20,
            numberOfTrees: 100,
            minimumExampleCountPerLeaf: 5
        ));

        return pipeline;
    }

    private PriceRecommendationResponse GetRuleBasedPrediction(PriceRecommendationRequest request)
    {
        // Base price by region (USD per square meter)
        var basePricePerSqm = GetBasePriceByRegion(request.Region);
        
        // Calculate base price
        var basePrice = (decimal)request.Area * basePricePerSqm;
        
        // Apply multipliers
        var multiplier = 1.0m;
        
        // Bedroom adjustment
        if (request.Bedrooms >= 3) multiplier *= 1.1m;
        else if (request.Bedrooms == 1) multiplier *= 0.9m;
        
        // Bathroom adjustment
        if (request.Bathrooms >= 2) multiplier *= 1.05m;
        
        // Feature adjustments
        if (request.HasWifi) multiplier *= 1.02m;
        if (request.HasParking) multiplier *= 1.08m;
        if (request.HasPool) multiplier *= 1.15m;
        if (request.IsRenovated) multiplier *= 1.12m;
        if (request.HasElevator) multiplier *= 1.03m;
        
        // Distance adjustment (closer to city center is more expensive)
        if (request.DistanceToCityCenter < 2) multiplier *= 1.1m;
        else if (request.DistanceToCityCenter > 10) multiplier *= 0.95m;
        
        var predictedPrice = basePrice * multiplier;
        
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

    private decimal GetBasePriceByRegion(int region)
    {
        return region switch
        {
            0 => 800m, // Tashkent
            1 => 600m, // Samarkand
            2 => 550m, // Bukhara
            3 => 500m, // Fergana
            4 => 450m, // Andijan
            5 => 400m, // Namangan
            6 => 350m, // Other regions
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
