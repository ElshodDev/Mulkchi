using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.ML;
using Microsoft.ML.Data;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.AI
{
    public class PriceRecommendationService : IPriceRecommendationService
    {
        private readonly IStorageBroker storageBroker;
        private readonly ILogger<PriceRecommendationService> logger;
        private readonly MLContext mlContext;
        private ITransformer? model;
        private PredictionEngine<PropertyPriceInput, PropertyPricePrediction>? predictionEngine;
        private readonly object modelLock = new();
        private DateTime lastTrainedAt = DateTime.MinValue;
        private const int MIN_TRAINING_DATA = 10;
        private const int RETRAIN_THRESHOLD = 50;
        private readonly string modelFilePath;

        public PriceRecommendationService(IStorageBroker storageBroker, ILogger<PriceRecommendationService> logger)
        {
            this.storageBroker = storageBroker;
            this.logger = logger;
            this.mlContext = new MLContext(seed: 0);

            var modelsDirectory = Path.Combine(AppContext.BaseDirectory, "models");
            if (!Directory.Exists(modelsDirectory))
            {
                Directory.CreateDirectory(modelsDirectory);
            }
            this.modelFilePath = Path.Combine(modelsDirectory, "price_model.zip");

            TryLoadPersistedModel();
        }

        private void TryLoadPersistedModel()
        {
            try
            {
                if (File.Exists(this.modelFilePath))
                {
                    lock (modelLock)
                    {
                        this.model = this.mlContext.Model.Load(this.modelFilePath, out _);
                        this.predictionEngine = this.mlContext.Model.CreatePredictionEngine<PropertyPriceInput, PropertyPricePrediction>(this.model);
                        this.lastTrainedAt = File.GetLastWriteTimeUtc(this.modelFilePath);
                    }
                    this.logger.LogInformation("Successfully loaded persisted ML price model from {Path}", this.modelFilePath);
                }
            }
            catch (Exception ex)
            {
                this.logger.LogWarning(ex, "Failed to load persisted ML price model from disk, falling back to dynamic initialization.");
            }
        }

        public async Task<PriceRecommendationResponse> PredictPriceAsync(PriceRecommendationRequest request)
        {
            // 1. Calculate Comparative Market Analysis (CMA) based on Geo KNN & similar listings
            var (cmaPrice, pricePerSqm, compsCount) = await CalculateCmaPriceAsync(request);

            // 2. Predict with ML model if available
            decimal? mlPrice = null;
            lock (modelLock)
            {
                if (model != null && predictionEngine != null)
                {
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

                    var prediction = predictionEngine.Predict(input);
                    if (prediction.PredictedPrice > 0)
                    {
                        mlPrice = (decimal)prediction.PredictedPrice;
                    }
                }
            }

            // 3. Fallback to rule-based prediction if ML price is unavailable
            var ruleBased = GetRuleBasedPrediction(request);
            decimal finalPrice;
            string confidence;
            bool isRuleBased;

            if (cmaPrice.HasValue && compsCount >= 3)
            {
                // If we have strong local comps, blend CMA with ML (or rule-based)
                if (mlPrice.HasValue)
                {
                    finalPrice = Math.Round((cmaPrice.Value * 0.65m) + (mlPrice.Value * 0.35m), 2);
                    confidence = compsCount >= 5 ? "Very High" : "High";
                    isRuleBased = false;
                }
                else
                {
                    finalPrice = Math.Round((cmaPrice.Value * 0.80m) + (ruleBased.PredictedPrice * 0.20m), 2);
                    confidence = "High";
                    isRuleBased = false;
                }
            }
            else if (mlPrice.HasValue)
            {
                finalPrice = mlPrice.Value;
                var trainingDataCount = await GetTrainingDataCountAsync();
                confidence = GetConfidenceLevel(trainingDataCount, finalPrice);
                isRuleBased = false;
            }
            else if (cmaPrice.HasValue && compsCount > 0)
            {
                finalPrice = Math.Round((cmaPrice.Value * 0.60m) + (ruleBased.PredictedPrice * 0.40m), 2);
                confidence = "Medium";
                isRuleBased = false;
            }
            else
            {
                finalPrice = ruleBased.PredictedPrice;
                confidence = "Low";
                isRuleBased = true;
            }

            // Apply dynamic adjustments (Weekend / Seasonality for daily rent)
            finalPrice = ApplyDynamicPricing(finalPrice, request.ListingType);

            int totalPropertiesAnalyzed = await GetTrainingDataCountAsync();

            string recommendation = GenerateSmartRecommendation(finalPrice, confidence, pricePerSqm, compsCount, request.District);

            return new PriceRecommendationResponse
            {
                PredictedPrice = Math.Round(finalPrice, 2),
                Currency = "USD",
                Confidence = confidence,
                PriceRange = CalculatePriceRange(finalPrice, confidence),
                BasedOnProperties = compsCount > 0 ? compsCount : totalPropertiesAnalyzed,
                Recommendation = recommendation,
                IsRuleBased = isRuleBased,
                AveragePricePerSquareMeter = pricePerSqm,
                ComparableCount = compsCount
            };
        }

        /// <summary>
        /// Comparative Market Analysis (CMA) using Geo K-Nearest Neighbors and multi-dimensional feature similarity.
        /// </summary>
        private async Task<(decimal? CmaPrice, decimal? PricePerSqm, int CompsCount)> CalculateCmaPriceAsync(PriceRecommendationRequest request)
        {
            if (request.Area <= 0)
                return (null, null, 0);

            try
            {
                var candidates = await storageBroker.SelectAllProperties()
                    .Where(p => p.DeletedDate == null &&
                                p.ListingType == request.ListingType &&
                                p.Area > 0 &&
                                ((p.ListingType == ListingType.Rent && p.MonthlyRent > 0) ||
                                 (p.ListingType == ListingType.Sale && p.SalePrice > 0) ||
                                 (p.ListingType == ListingType.ShortTermRent && p.PricePerNight > 0)))
                    .ToListAsync();

                if (!candidates.Any())
                    return (null, null, 0);

                var scoredComparables = new List<(decimal PricePerSqm, double Weight)>();

                foreach (var comp in candidates)
                {
                    decimal price = comp.ListingType switch
                    {
                        ListingType.Rent => comp.MonthlyRent!.Value,
                        ListingType.ShortTermRent => comp.PricePerNight!.Value,
                        _ => comp.SalePrice!.Value
                    };

                    decimal compPricePerSqm = price / (decimal)comp.Area;

                    // Outlier removal (e.g. data errors < 5$ or > 50000$ per sqm)
                    if (compPricePerSqm <= 0) continue;

                    double weight = 1.0;

                    // 1. Spatial proximity weight
                    if (request.Latitude.HasValue && request.Longitude.HasValue && comp.Latitude.HasValue && comp.Longitude.HasValue)
                    {
                        double distanceKm = CalculateHaversineDistanceKm(
                            request.Latitude.Value, request.Longitude.Value,
                            comp.Latitude.Value, comp.Longitude.Value);

                        if (distanceKm > 10.0) continue; // Skip properties further than 10 km
                        weight *= 1.0 / (1.0 + (distanceKm * 0.8));
                    }
                    else if (!string.IsNullOrWhiteSpace(request.District) && !string.IsNullOrWhiteSpace(comp.District))
                    {
                        if (string.Equals(request.District.Trim(), comp.District.Trim(), StringComparison.OrdinalIgnoreCase))
                        {
                            weight *= 1.5;
                        }
                    }
                    else if (request.Region == (int)comp.Region)
                    {
                        weight *= 0.8;
                    }
                    else
                    {
                        continue;
                    }

                    // 2. Area similarity weight
                    double areaRatio = Math.Min(request.Area, (float)comp.Area) / Math.Max(request.Area, (float)comp.Area);
                    weight *= (0.5 + (areaRatio * 0.5));

                    // 3. Bedroom similarity weight
                    int bedDiff = Math.Abs(request.Bedrooms - comp.NumberOfBedrooms);
                    weight *= bedDiff switch
                    {
                        0 => 1.2,
                        1 => 0.9,
                        2 => 0.6,
                        _ => 0.3
                    };

                    // 4. Renovation Level similarity
                    if (request.RenovationLevel == comp.RenovationLevel)
                        weight *= 1.2;

                    scoredComparables.Add((compPricePerSqm, weight));
                }

                if (!scoredComparables.Any())
                    return (null, null, 0);

                // Take top 8 closest/most similar comps
                var topComps = scoredComparables.OrderByDescending(c => c.Weight).Take(8).ToList();
                double totalWeight = topComps.Sum(c => c.Weight);

                if (totalWeight <= 0)
                    return (null, null, 0);

                decimal weightedPricePerSqm = topComps.Sum(c => c.PricePerSqm * (decimal)(c.Weight / totalWeight));
                decimal estimatedPrice = weightedPricePerSqm * (decimal)request.Area;

                return (Math.Round(estimatedPrice, 2), Math.Round(weightedPricePerSqm, 2), topComps.Count);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error executing Geo KNN CMA price estimation.");
                return (null, null, 0);
            }
        }

        private static double CalculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double EarthRadiusKm = 6371.0;
            double dLat = DegreesToRadians(lat2 - lat1);
            double dLon = DegreesToRadians(lon2 - lon1);

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c;
        }

        private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;

        private decimal ApplyDynamicPricing(decimal basePrice, ListingType listingType)
        {
            if (listingType != ListingType.ShortTermRent) return basePrice;

            var now = DateTime.UtcNow;
            var multiplier = 1.0m;

            if (now.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday)
                multiplier *= 1.15m;

            if (now.Month is >= 6 and <= 8)
                multiplier *= 1.10m;

            if (now.Month is 1 or 2)
                multiplier *= 0.90m;

            return basePrice * multiplier;
        }

        public async Task TrainModelAsync()
        {
            try
            {
                var properties = await GetTrainingDataAsync();

                if (properties.Count < MIN_TRAINING_DATA)
                {
                    this.logger.LogInformation("Insufficient training data ({Count}/{Min}). Model training skipped.", properties.Count, MIN_TRAINING_DATA);
                    return;
                }

                var trainingData = ConvertToTrainingData(properties);
                var pipeline = BuildTrainingPipeline();

                var trainedModel = pipeline.Fit(trainingData);

                lock (modelLock)
                {
                    this.model = trainedModel;
                    this.predictionEngine = mlContext.Model.CreatePredictionEngine<PropertyPriceInput, PropertyPricePrediction>(model);
                    this.lastTrainedAt = DateTime.UtcNow;
                }

                // Persist model to disk for reliable server restarts
                try
                {
                    this.mlContext.Model.Save(trainedModel, trainingData.Schema, this.modelFilePath);
                    this.logger.LogInformation("Successfully persisted trained ML price model to {Path}", this.modelFilePath);
                }
                catch (Exception saveEx)
                {
                    this.logger.LogWarning(saveEx, "Failed to save trained ML model to disk.");
                }
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
            var properties = await storageBroker.SelectAllProperties()
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
            return await storageBroker.SelectAllProperties()
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

            if (request.BuildingType == BuildingType.NewBuilding) multiplier *= 1.25m;
            
            multiplier *= request.RenovationLevel switch
            {
                RenovationLevel.ShellAndCore => 0.7m,
                RenovationLevel.Average => 1.0m,
                RenovationLevel.EuroLux => 1.25m,
                _ => 1.0m
            };

            multiplier *= GetDistrictWeight(request.District, request.Region);

            if (request.DistanceToCityCenter > 0 && request.DistanceToCityCenter < 2) multiplier *= 1.1m;
            else if (request.DistanceToCityCenter > 10) multiplier *= 0.95m;

            var predictedPrice = basePrice * multiplier;
            predictedPrice = ApplyDynamicPricing(predictedPrice, request.ListingType);

            return new PriceRecommendationResponse
            {
                PredictedPrice = Math.Round(predictedPrice, 2),
                Currency = "USD",
                Confidence = "Low",
                PriceRange = CalculatePriceRange(predictedPrice, "Low"),
                BasedOnProperties = 0,
                Recommendation = GenerateSmartRecommendation(predictedPrice, "Low", basePricePerSqm, 0, request.District),
                IsRuleBased = true
            };
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

        private decimal GetBasePriceByRegion(int region, ListingType listingType)
        {
            if (listingType == ListingType.Rent) 
            {
                return region switch
                {
                    0 => 8m, // Toshkent shahar $8 per sqm rent
                    1 => 5m,
                    2 => 4.5m,
                    _ => 3.5m
                };
            }

            if (listingType == ListingType.ShortTermRent)
            {
                return region switch
                {
                    0 => 0.5m,
                    1 => 0.3m,
                    2 => 0.25m,
                    _ => 0.2m
                };
            }

            return region switch
            {
                0 => 850m, // Toshkent shahar $850 per sqm
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

        private string GenerateSmartRecommendation(
            decimal predictedPrice, 
            string confidence, 
            decimal? pricePerSqm, 
            int compsCount, 
            string? district)
        {
            var priceRange = CalculatePriceRange(predictedPrice, confidence);
            string districtInfo = !string.IsNullOrWhiteSpace(district) ? $"{district} hududi uchun " : "";

            if (compsCount >= 3 && pricePerSqm.HasValue)
            {
                return $"{districtInfo}yaqin atrofdagi {compsCount} ta o'xshash mulk tahlili asosida (o'rtacha 1 m²: ${pricePerSqm.Value:N0}), tavsiya etilgan narx ${predictedPrice:N0} (oralig'i: ${priceRange.Min:N0} - ${priceRange.Max:N0}).";
            }

            return confidence switch
            {
                "Low" => $"{districtInfo}taxminiy narx ${priceRange.Min:N0} - ${priceRange.Max:N0} oralig'ida (bozor bazasi asosida).",
                "Medium" => $"{districtInfo}o'rtacha bozor narxi ${priceRange.Min:N0} - ${priceRange.Max:N0} oralig'ida baholandi.",
                "High" => $"{districtInfo}ushbu parametrlar bo'yicha yuqori aniqlikdagi narx: ${predictedPrice:N0} (±10%).",
                "Very High" => $"{districtInfo}aniq bozor narxi: ${predictedPrice:N0} ± ${((priceRange.Max - priceRange.Min) / 2):N0}.",
                _ => $"Tavsiya etilgan narx: ${priceRange.Min:N0} - ${priceRange.Max:N0}."
            };
        }
    }
}
