using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.AI;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Mulkchi.Api.Services.Foundations.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly StorageBroker storageBroker;

    public AnalyticsService(StorageBroker storageBroker)
    {
        this.storageBroker = storageBroker;
    }

    public async Task<object> GetMarketOverviewAsync()
    {
        var today = System.DateTimeOffset.UtcNow.Date;
        var yesterday = today.AddDays(-1);

        var properties = this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue)
            .AsQueryable();

        var totalListings = await properties.CountAsync();
        var totalForSale = await properties.CountAsync(p => p.ListingType == ListingType.Sale);
        var totalForRent = await properties.CountAsync(
            p => p.ListingType == ListingType.Rent || p.ListingType == ListingType.ShortTermRent);

        var averageSalePrice = await properties
            .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
            .AverageAsync(p => (decimal?)p.SalePrice) ?? 0;

        var averageRentPrice = await properties
            .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
            .AverageAsync(p => (decimal?)p.MonthlyRent) ?? 0;

        var newListingsToday = await properties
            .CountAsync(p => p.CreatedDate.Date == today);

        var newListingsYesterday = await properties
            .CountAsync(p => p.CreatedDate.Date == yesterday);

        var lastWeek = today.AddDays(-7);
        var avgNewListingsPerDay = await properties
            .Where(p => p.CreatedDate.Date >= lastWeek && p.CreatedDate.Date < today)
            .GroupBy(p => p.CreatedDate.Date)
            .Select(g => g.Count())
            .AverageAsync();

        var topCity = await properties
            .GroupBy(p => p.City)
            .Select(g => new { City = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync();

        var averagePricePerSqm = await properties
            .Where(p => p.SalePrice.HasValue && p.SalePrice > 0 && p.Area > 0)
            .Select(p => p.SalePrice.GetValueOrDefault() / (decimal)p.Area)
            .AverageAsync();

        var priceChangePercent = newListingsYesterday > 0
            ? ((double)(newListingsToday - newListingsYesterday) / newListingsYesterday * 100)
            : 0;

        return new
        {
            totalListings,
            totalForSale,
            totalForRent,
            averageSalePrice,
            averageRentPrice,
            newListingsToday,
            newListingsYesterday,
            avgNewListingsPerDay = Math.Round(avgNewListingsPerDay, 1),
            topCity = topCity?.City ?? "Toshkent",
            topCityCount = topCity?.Count ?? 0,
            averagePricePerSqm = Math.Round(averagePricePerSqm, 2),
            priceChangePercent = Math.Round(priceChangePercent, 1),
            lastUpdated = System.DateTimeOffset.UtcNow
        };
    }

    public async Task<object> GetAnalyticsByRegionAsync()
    {
        var regionData = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue)
            .GroupBy(p => p.Region)
            .Select(g => new
            {
                region = g.Key.ToString(),
                listingsCount = g.Count(),
                averageSalePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Average(p => (decimal?)p.SalePrice) ?? 0,
                averageRentPrice = g
                    .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                    .Average(p => (decimal?)p.MonthlyRent) ?? 0
            })
            .OrderByDescending(r => r.listingsCount)
            .ToListAsync();

        return regionData;
    }

    public async Task<object> GetPriceTrendsAsync()
    {
        var twelveMonthsAgo = System.DateTimeOffset.UtcNow.AddMonths(-12);

        var monthlyData = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.CreatedDate >= twelveMonthsAgo)
            .GroupBy(p => new { p.CreatedDate.Year, p.CreatedDate.Month })
            .Select(g => new
            {
                year = g.Key.Year,
                monthNumber = g.Key.Month,
                averagePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Average(p => (decimal?)p.SalePrice) ?? 0,
                listingsCount = g.Count()
            })
            .OrderBy(x => x.year)
            .ThenBy(x => x.monthNumber)
            .ToListAsync();

        var priceTrends = monthlyData
            .Select(item => new
            {
                month = $"{item.year}-{item.monthNumber:D2}",
                item.averagePrice,
                item.listingsCount
            })
            .ToList();

        return priceTrends;
    }

    public async Task<object> GetAnalyticsByDistrictAsync()
    {
        var districtData = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue)
            .GroupBy(p => new { p.Region, p.District })
            .Select(g => new
            {
                region = g.Key.Region.ToString(),
                district = g.Key.District,
                listingsCount = g.Count(),
                averageSalePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Average(p => (decimal?)p.SalePrice) ?? 0,
                averageRentPrice = g
                    .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                    .Average(p => (decimal?)p.MonthlyRent) ?? 0,
                minSalePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Min(p => (decimal?)p.SalePrice) ?? 0,
                maxSalePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Max(p => (decimal?)p.SalePrice) ?? 0,
                minRentPrice = g
                    .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                    .Min(p => (decimal?)p.MonthlyRent) ?? 0,
                maxRentPrice = g
                    .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                    .Max(p => (decimal?)p.MonthlyRent) ?? 0,
                pricePerSqm = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0 && p.Area > 0)
                    .Average(p => (decimal?)(p.SalePrice / (decimal)p.Area)) ?? 0
            })
            .OrderByDescending(r => r.listingsCount)
            .ToListAsync();

        return districtData;
    }

    public async Task<object> GetDistrictPriceRangesAsync()
    {
        var districts = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && !string.IsNullOrEmpty(p.District))
            .Select(p => p.District)
            .Distinct()
            .ToListAsync();

        var priceRanges = new List<object>();

        foreach (var district in districts)
        {
            var properties = this.storageBroker.Properties
                .Where(p => !p.DeletedDate.HasValue && p.District == district);

            var salePrices = await properties
                .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                .Select(p => p.SalePrice.GetValueOrDefault())
                .ToListAsync();

            var rentPrices = await properties
                .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                .Select(p => p.MonthlyRent.GetValueOrDefault())
                .ToListAsync();

            var priceRange = new
            {
                district,
                salePriceRange = new
                {
                    min = salePrices.Any() ? salePrices.Min() : 0m,
                    max = salePrices.Any() ? salePrices.Max() : 0m,
                    average = salePrices.Any() ? salePrices.Average() : 0m,
                    median = salePrices.Any() ? CalculateMedian(salePrices) : 0m,
                    quartile25 = salePrices.Any() ? CalculatePercentile(salePrices, 25) : 0m,
                    quartile75 = salePrices.Any() ? CalculatePercentile(salePrices, 75) : 0m,
                    count = salePrices.Count
                },
                rentPriceRange = new
                {
                    min = rentPrices.Any() ? rentPrices.Min() : 0m,
                    max = rentPrices.Any() ? rentPrices.Max() : 0m,
                    average = rentPrices.Any() ? rentPrices.Average() : 0m,
                    median = rentPrices.Any() ? CalculateMedian(rentPrices) : 0m,
                    quartile25 = rentPrices.Any() ? CalculatePercentile(rentPrices, 25) : 0m,
                    quartile75 = rentPrices.Any() ? CalculatePercentile(rentPrices, 75) : 0m,
                    count = rentPrices.Count
                },
                propertyTypes = await properties
                    .GroupBy(p => p.Type)
                    .Select(g => new
                    {
                        type = g.Key.ToString(),
                        count = g.Count(),
                        averagePrice = g.Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                            .Average(p => (decimal?)p.SalePrice) ?? 0m
                    })
                    .ToListAsync()
            };

            priceRanges.Add(priceRange);
        }

        return priceRanges.OrderByDescending(r => ((dynamic)r).salePriceRange.count).ToList();
    }

    public async Task<object> GetAiRecommendationAccuracyAsync()
    {
        var recommendations = await this.storageBroker.AiRecommendations
            .Where(r => !r.DeletedDate.HasValue)
            .ToListAsync();

        var totalRecommendations = recommendations.Count;
        var viewedRecommendations = recommendations.Count(r => r.IsActedUpon);
        var clickedRecommendations = recommendations.Count(r => r.IsActedUpon);

        var byType = recommendations
            .GroupBy(r => r.Type)
            .Select(g => new
            {
                type = g.Key.ToString(),
                total = g.Count(),
                viewed = g.Count(r => r.IsActedUpon),
                clicked = g.Count(r => r.IsActedUpon),
                conversionRate = g.Any() ? (decimal)g.Count(r => r.IsActedUpon) / g.Count() : 0m,
                averageScore = g.Any() ? g.Average(r => r.Score) : 0m
            })
            .ToList();

        var variantA = recommendations.Count(r =>
            r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"A\""));
        var variantB = recommendations.Count(r =>
            r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"B\""));
        var variantAClicks = recommendations.Count(r =>
            r.IsActedUpon && r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"A\""));
        var variantBClicks = recommendations.Count(r =>
            r.IsActedUpon && r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"B\""));

        var propertiesWithRecommendations = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.SalePrice.HasValue)
            .Join(
                this.storageBroker.AiRecommendations.Where(r => !r.DeletedDate.HasValue),
                p => p.Id,
                r => r.PropertyId,
                (p, r) => new { Property = p, Recommendation = r })
            .ToListAsync();

        var priceAccuracy = propertiesWithRecommendations
            .Where(x => x.Property.SalePrice.HasValue)
            .Select(x => new
            {
                propertyId = x.Property.Id,
                actualPrice = x.Property.SalePrice.GetValueOrDefault(),
                score = x.Recommendation.Score,
                isAccurate = x.Recommendation.Score >= 0.7m
            })
            .ToList();

        var avgAccuracy = priceAccuracy.Any()
            ? (decimal)priceAccuracy.Count(p => p.isAccurate) / priceAccuracy.Count * 100
            : 0m;

        return new
        {
            totalRecommendations,
            viewedRecommendations,
            clickedRecommendations,
            clickThroughRate = totalRecommendations > 0 ? (decimal)clickedRecommendations / totalRecommendations : 0m,
            conversionRate = totalRecommendations > 0 ? (decimal)viewedRecommendations / totalRecommendations : 0m,
            byType,
            abTestPerformance = new
            {
                variantA = new { count = variantA, clicks = variantAClicks, ctr = variantA > 0 ? (decimal)variantAClicks / variantA : 0m },
                variantB = new { count = variantB, clicks = variantBClicks, ctr = variantB > 0 ? (decimal)variantBClicks / variantB : 0m }
            },
            pricePredictionAccuracy = new
            {
                averageDeviation = avgAccuracy,
                predictionsCount = priceAccuracy.Count,
                highScoreRecommendations = priceAccuracy.Count(p => p.score >= 0.8m),
                mediumScoreRecommendations = priceAccuracy.Count(p => p.score >= 0.5m && p.score < 0.8m),
                accurateRecommendations = priceAccuracy.Count(p => p.isAccurate)
            }
        };
    }

    public async Task<object> GetPropertyPriceHeatmapAsync()
    {
        var properties = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.Latitude.HasValue && p.Longitude.HasValue)
            .Where(p => p.SalePrice.HasValue || p.MonthlyRent.HasValue)
            .Select(p => new
            {
                p.Id,
                p.Latitude,
                p.Longitude,
                p.SalePrice,
                p.MonthlyRent,
                p.Region,
                p.District,
                p.Type,
                p.Area
            })
            .ToListAsync();

        var heatmapData = properties
            .GroupBy(p => new
            {
                LatGrid = System.Math.Round(p.Latitude.GetValueOrDefault(), 2),
                LngGrid = System.Math.Round(p.Longitude.GetValueOrDefault(), 2)
            })
            .Select(g => new
            {
                latitude = g.Key.LatGrid,
                longitude = g.Key.LngGrid,
                count = g.Count(),
                averageSalePrice = g.Where(p => p.SalePrice.HasValue).Average(p => (decimal?)p.SalePrice) ?? 0m,
                averageRentPrice = g.Where(p => p.MonthlyRent.HasValue).Average(p => (decimal?)p.MonthlyRent) ?? 0m,
                minPrice = g.Min(p => p.SalePrice ?? p.MonthlyRent ?? 0m),
                maxPrice = g.Max(p => p.SalePrice ?? p.MonthlyRent ?? 0m),
                density = g.Count() / (0.01 * 0.01)
            })
            .OrderByDescending(h => h.density)
            .ToList();

        var allPrices = properties
            .Select(p => p.SalePrice ?? p.MonthlyRent ?? 0m)
            .Where(p => p > 0)
            .OrderBy(p => p)
            .ToList();

        return new
        {
            gridCells = heatmapData,
            priceStats = new
            {
                min = allPrices.Any() ? allPrices.Min() : 0m,
                max = allPrices.Any() ? allPrices.Max() : 0m,
                average = allPrices.Any() ? allPrices.Average() : 0m,
                median = allPrices.Any() ? CalculateMedian(allPrices) : 0m,
                p25 = allPrices.Any() ? CalculatePercentile(allPrices, 25) : 0m,
                p75 = allPrices.Any() ? CalculatePercentile(allPrices, 75) : 0m
            },
            totalPoints = properties.Count
        };
    }

    private static decimal CalculateMedian(List<decimal> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        int count = sorted.Count;
        if (count == 0) return 0m;
        if (count % 2 == 1) return sorted[count / 2];
        return (sorted[count / 2 - 1] + sorted[count / 2]) / 2m;
    }

    private static decimal CalculatePercentile(List<decimal> values, double percentile)
    {
        var sorted = values.OrderBy(v => v).ToList();
        int count = sorted.Count;
        if (count == 0) return 0m;
        double index = (percentile / 100) * (count - 1);
        int lower = (int)System.Math.Floor(index);
        int upper = (int)System.Math.Ceiling(index);
        if (lower == upper) return sorted[lower];
        double weight = index - lower;
        return sorted[lower] * (1m - (decimal)weight) + sorted[upper] * (decimal)weight;
    }

    #region Property Analysis Engine

    public async Task<PropertyAnalysisResult> AnalyzePropertyAsync(Guid propertyId)
    {
        var property = await this.storageBroker.Properties
            .Where(p => p.Id == propertyId && !p.DeletedDate.HasValue)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.SalePrice,
                p.MonthlyRent,
                p.Area,
                p.Region,
                p.District,
                p.Type,
                p.HasWifi,
                p.HasParking,
                p.HasAirConditioning,
                p.HasFurniture,
                p.Floor,
                p.TotalFloors,
                p.NumberOfBedrooms,
                p.AverageRating,
                p.ViewsCount,
                p.CreatedDate
            })
            .FirstOrDefaultAsync();

        if (property == null)
            throw new Exception("Property not found");

        var currentPrice = property.SalePrice ?? property.MonthlyRent * 100 ?? 0m;
        if (currentPrice == 0)
            throw new Exception("Property has no price set");

        var comparables = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.District == property.District)
            .Where(p => p.Type == property.Type)
            .Where(p => p.Id != propertyId)
            .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
            .Select(p => new
            {
                p.SalePrice,
                p.Area,
                p.AverageRating,
                p.HasWifi,
                p.HasParking,
                p.HasAirConditioning,
                p.Floor
            })
            .ToListAsync();

        var districtPrices = comparables.Select(c => c.SalePrice.GetValueOrDefault()).ToList();
        var districtAvgPrice = districtPrices.Any() ? districtPrices.Average() : currentPrice;
        var districtMedianPrice = districtPrices.Any() ? CalculateMedian(districtPrices) : currentPrice;
        var districtAvgPricePerSqm = comparables.Any(c => c.Area > 0)
            ? comparables.Where(c => c.Area > 0).Average(c => c.SalePrice.GetValueOrDefault() / (decimal)c.Area)
            : 0m;

        var featureAdjustment = 0m;
        var comparableCount = comparables.Count;

        if (comparableCount > 0)
        {
            if (property.HasWifi && comparables.Any(c => c.HasWifi))
                featureAdjustment += districtAvgPrice * 0.02m;

            if (property.HasParking && comparables.Any(c => c.HasParking))
                featureAdjustment += districtAvgPrice * 0.03m;

            if (property.HasAirConditioning && comparables.Any(c => c.HasAirConditioning))
                featureAdjustment += districtAvgPrice * 0.015m;

            if (property.Floor > 0 && property.TotalFloors > 0)
            {
                var floorRatio = (double)property.Floor / property.TotalFloors;
                if (floorRatio >= 0.3 && floorRatio <= 0.7)
                    featureAdjustment += districtAvgPrice * 0.02m;
                else if (floorRatio < 0.3)
                    featureAdjustment -= districtAvgPrice * 0.01m;
            }

            if (property.AverageRating > 4.5m && comparables.Any(c => c.AverageRating > 0))
                featureAdjustment += districtAvgPrice * 0.05m;
        }

        var volatilityFactor = 0.05;
        var marketSentiment = 1.02;

        var priceMultiplier = marketSentiment + (volatilityFactor * 0.5);
        var estimatedMarketPrice = (districtAvgPrice + featureAdjustment) * (decimal)priceMultiplier;
        var priceDifference = currentPrice - estimatedMarketPrice;
        var priceDifferencePercent = estimatedMarketPrice > 0
            ? (double)(priceDifference / estimatedMarketPrice) * 100
            : 0;

        var status = priceDifferencePercent switch
        {
            < -20 => PriceStatus.SignificantlyUnderpriced,
            < -10 => PriceStatus.Underpriced,
            <= 10 => PriceStatus.FairPrice,
            <= 20 => PriceStatus.Overpriced,
            _ => PriceStatus.SignificantlyOverpriced
        };

        var valueScore = Math.Max(0, Math.Min(100, 50 - priceDifferencePercent * 2));

        var investmentPotential = CalculateInvestmentPotential(property, districtPrices, comparables.Count);

        var recommendation = status switch
        {
            PriceStatus.SignificantlyUnderpriced => "🟢 Ajoyib imkoniyat! Bozor narxidan 20%+ arzon. Tezda ko'rib chiqing.",
            PriceStatus.Underpriced => "🟢 Yaxshi taklif. Bozor narxidan 10-20% arzon.",
            PriceStatus.FairPrice => "🟡 Adolatli narx. Bozor narxi bilan mos keladi.",
            PriceStatus.Overpriced => "🟠 Yuqori narx. Bozor narxidan 10-20% qimmat.",
            PriceStatus.SignificantlyOverpriced => "🔴 Juda qimmat. Bozor narxidan 20%+ yuqori. Savdo qiling.",
            _ => "Ma'lumot yetarli emas"
        };

        var riskFactors = new List<string>();
        var positiveFactors = new List<string>();

        if (property.ViewsCount < 10 && property.CreatedDate < DateTimeOffset.UtcNow.AddDays(-30))
            riskFactors.Add("Kam ko'rishlar - e'lon uzoq vaqt turibdi");

        if (property.AverageRating < 3.0m)
            riskFactors.Add("Past reyting - ehtiyot bo'ling");

        if (comparables.Count < 5)
            riskFactors.Add("Kam solishtirma mulklar - baho aniq emas");

        if (property.HasWifi && property.HasParking && property.HasAirConditioning)
            positiveFactors.Add("Barcha asosiy qulayliklar mavjud");

        if (property.AverageRating > 4.5m)
            positiveFactors.Add("Yuqori reytingli mulk");

        if (status == PriceStatus.SignificantlyUnderpriced || status == PriceStatus.Underpriced)
            positiveFactors.Add("Bozor narxidan arzon");

        var riskScore = Math.Min(100, riskFactors.Count * 15 + (comparables.Count < 5 ? 20 : 0));

        return new PropertyAnalysisResult
        {
            PropertyId = propertyId,
            PropertyTitle = property.Title,
            CurrentPrice = currentPrice,
            EstimatedMarketPrice = estimatedMarketPrice,
            PriceDifference = priceDifference,
            PriceDifferencePercent = priceDifferencePercent,
            Status = status,
            DistrictAveragePrice = districtAvgPrice,
            DistrictMedianPrice = districtMedianPrice,
            DistrictPricePerSqm = districtAvgPricePerSqm,
            ComparablePropertiesCount = comparables.Count,
            ValueScore = valueScore,
            InvestmentPotential = investmentPotential,
            Recommendation = recommendation,
            RiskScore = riskScore,
            RiskFactors = riskFactors,
            PositiveFactors = positiveFactors
        };
    }

    private double CalculateInvestmentPotential(dynamic property, List<decimal> districtPrices, int comparableCount)
    {
        var score = 40.0;

        var daysListed = Math.Max(1, (DateTimeOffset.UtcNow - property.CreatedDate).TotalDays);
        var viewsPerDay = property.ViewsCount / daysListed;

        if (viewsPerDay > 5) score += 15;
        if (viewsPerDay > 10) score += 10;

        if (property.HasWifi) score += 3;
        if (property.HasParking) score += 4;
        if (property.HasAirConditioning) score += 3;
        if (property.HasFurniture) score += 5;

        score += (double)(property.AverageRating - 2.5m) * 12;

        if (comparableCount < 10) score += 10;
        if (comparableCount < 5) score += 5;

        if (property.ViewsCount > 200) score += 5;

        return Math.Max(0, Math.Min(100, score));
    }

    public async Task<List<PropertyDealScore>> FindBestDealsAsync(int limit = 10)
    {
        var properties = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.SalePrice.HasValue && p.SalePrice > 0)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.SalePrice,
                p.Region,
                p.District,
                p.Area,
                p.Type,
                p.AverageRating,
                p.ViewsCount,
                p.CreatedDate
            })
            .ToListAsync();

        var deals = new List<PropertyDealScore>();

        foreach (var prop in properties)
        {
            var districtAvg = await this.storageBroker.Properties
                .Where(p => !p.DeletedDate.HasValue && p.District == prop.District)
                .Where(p => p.Type == prop.Type)
                .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                .AverageAsync(p => (decimal?)p.SalePrice) ?? prop.SalePrice.GetValueOrDefault();

            var discountPercent = (double)((districtAvg - prop.SalePrice.GetValueOrDefault()) / districtAvg * 100);

            if (discountPercent > 5)
            {
                var dealScore = Math.Min(100, discountPercent * 3 + (double)prop.AverageRating * 5);

                deals.Add(new PropertyDealScore
                {
                    PropertyId = prop.Id,
                    Title = prop.Title,
                    Location = $"{prop.District}",
                    Price = prop.SalePrice.GetValueOrDefault(),
                    EstimatedValue = districtAvg,
                    DealScore = dealScore,
                    DiscountPercent = discountPercent,
                    DealType = "BestDeal",
                    Reasons = new List<string>
                    {
                        $"Bozor narxidan {discountPercent:F1}% arzon",
                        $"O'rtacha narx: {districtAvg:N0} so'm"
                    }
                });
            }
        }

        return deals.OrderByDescending(d => d.DealScore).Take(limit).ToList();
    }

    public async Task<List<PropertyDealScore>> FindHighRoiPropertiesAsync(int limit = 10)
    {
        var properties = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.SalePrice.HasValue && p.MonthlyRent.HasValue)
            .Where(p => p.SalePrice > 0 && p.MonthlyRent > 0)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.SalePrice,
                p.MonthlyRent,
                p.Region,
                p.District,
                p.Area,
                p.Type,
                p.AverageRating
            })
            .ToListAsync();

        var roiProperties = new List<PropertyDealScore>();

        foreach (var prop in properties)
        {
            var annualRent = prop.MonthlyRent.GetValueOrDefault() * 12;
            var roi = (double)(annualRent / prop.SalePrice.GetValueOrDefault() * 100);

            if (roi > 8)
            {
                var dealScore = Math.Min(100, roi * 10 + (double)prop.AverageRating * 3);

                roiProperties.Add(new PropertyDealScore
                {
                    PropertyId = prop.Id,
                    Title = prop.Title,
                    Location = $"{prop.District}",
                    Price = prop.SalePrice.GetValueOrDefault(),
                    DealScore = dealScore,
                    RoiEstimate = roi,
                    DealType = "HighROI",
                    Reasons = new List<string>
                    {
                        $"Yillik ROI: {roi:F1}%",
                        $"Oylik ijaradan: {prop.MonthlyRent.GetValueOrDefault():N0} so'm"
                    }
                });
            }
        }

        return roiProperties.OrderByDescending(r => r.RoiEstimate).Take(limit).ToList();
    }

    public async Task<List<PropertyDealScore>> FindFastSellingPropertiesAsync(int limit = 10)
    {
        var recentDate = DateTimeOffset.UtcNow.AddDays(-7);

        var properties = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.SalePrice.HasValue && p.SalePrice > 0)
            .Where(p => p.ViewsCount > 20 || p.CreatedDate >= recentDate)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.SalePrice,
                p.Region,
                p.District,
                p.ViewsCount,
                p.FavoritesCount,
                p.CreatedDate,
                p.AverageRating
            })
            .ToListAsync();

        var fastSelling = new List<PropertyDealScore>();

        foreach (var prop in properties)
        {
            var daysListed = (DateTimeOffset.UtcNow - prop.CreatedDate).TotalDays;
            var viewsPerDay = daysListed > 0 ? prop.ViewsCount / daysListed : prop.ViewsCount;
            var engagementScore = viewsPerDay * 2 + prop.FavoritesCount;

            if (engagementScore > 5)
            {
                var dealScore = Math.Min(100, engagementScore * 5 + (double)prop.AverageRating * 5);

                fastSelling.Add(new PropertyDealScore
                {
                    PropertyId = prop.Id,
                    Title = prop.Title,
                    Location = $"{prop.District}",
                    Price = prop.SalePrice.GetValueOrDefault(),
                    DealScore = dealScore,
                    DealType = "FastSelling",
                    Reasons = new List<string>
                    {
                        $"Kuniga {viewsPerDay:F0} marta ko'rilyapti",
                        $"{prop.FavoritesCount} ta sevimlilar ro'yxatida",
                        daysListed < 7 ? "Yangi e'lon (7 kundan kam)" : "Faol qiziqish"
                    }
                });
            }
        }

        return fastSelling.OrderByDescending(f => f.DealScore).Take(limit).ToList();
    }

    #endregion

    #region Location Intelligence

    public async Task<LocationScore> GetLocationScoreAsync(string region, string district)
    {
        UzbekistanRegion? regionEnum = null;
        if (!string.IsNullOrEmpty(region))
        {
            var normalizedRegion = region.Replace(" ", "").Replace("-", "");
            if (System.Enum.TryParse<UzbekistanRegion>(normalizedRegion, true, out var parsedRegion))
            {
                regionEnum = parsedRegion;
            }
        }

        var query = this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.District == district);

        if (regionEnum.HasValue)
        {
            query = query.Where(p => p.Region == regionEnum.Value);
        }

        var properties = await query
            .Select(p => new
            {
                p.SalePrice,
                p.MonthlyRent,
                p.Area,
                p.AverageRating,
                p.ViewsCount,
                p.HasWifi,
                p.HasParking,
                p.HasAirConditioning,
                p.HasMetroNearby,
                p.HasBusStop,
                p.HasMarketNearby,
                p.HasSchoolNearby,
                p.HasHospitalNearby
            })
            .ToListAsync();

        if (!properties.Any())
            return new LocationScore
            {
                Region = region,
                District = district,
                OverallScore = 0,
                Verdict = "Ma'lumot yetarli emas"
            };

        var avgPrice = properties.Where(p => p.SalePrice.HasValue).Average(p => p.SalePrice.GetValueOrDefault());
        var affordabilityScore = Math.Max(0, 100 - (double)(avgPrice / 10000000m));

        var totalProps = properties.Count;
        var wifiPct = (double)properties.Count(p => p.HasWifi) / totalProps * 100;
        var parkingPct = (double)properties.Count(p => p.HasParking) / totalProps * 100;
        var acPct = (double)properties.Count(p => p.HasAirConditioning) / totalProps * 100;
        var infrastructureScore = (wifiPct + parkingPct + acPct) / 3;

        var metroPct = (double)properties.Count(p => p.HasMetroNearby) / totalProps * 100;
        var busPct = (double)properties.Count(p => p.HasBusStop) / totalProps * 100;
        var connectivityScore = (metroPct * 1.5 + busPct) / 2.5;

        var marketPct = (double)properties.Count(p => p.HasMarketNearby) / totalProps * 100;
        var schoolPct = (double)properties.Count(p => p.HasSchoolNearby) / totalProps * 100;
        var hospitalPct = (double)properties.Count(p => p.HasHospitalNearby) / totalProps * 100;
        var amenitiesScore = (marketPct + schoolPct + hospitalPct) / 3;

        var avgViews = properties.Average(p => p.ViewsCount);
        var growthScore = Math.Min(100, avgViews / 5);

        var avgRating = properties.Average(p => p.AverageRating);
        var safetyScore = (double)avgRating * 20;

        var overallScore = (affordabilityScore + infrastructureScore + connectivityScore +
                           amenitiesScore + growthScore + safetyScore) / 6;

        var verdict = overallScore switch
        {
            >= 80 => "🏆 Ajoyib joylashuv - Yashash va investitsiya uchun ideal",
            >= 65 => "✅ Yaxshi joylashuv - Ko'p afzalliklar mavjud",
            >= 50 => "🟡 O'rtacha - Ba'zi qulayliklar yetishmayapti",
            >= 35 => "🟠 Past sifat - Diqqat bilan tanlang",
            _ => "🔴 Tavsiya etilmaydi"
        };

        var investmentOutlook = growthScore > 70
            ? "📈 Yuqori o'sish potensiali - Narxlarni oshishi kutilmoqda"
            : growthScore > 50
            ? "📊 Barqaror bozor - Xavfsiz investitsiya"
            : "📉 Sekin o'sish - Uzoq muddatli investitsiya uchun";

        return new LocationScore
        {
            Region = region,
            District = district,
            OverallScore = Math.Round(overallScore, 1),
            AffordabilityScore = Math.Round(affordabilityScore, 1),
            GrowthPotentialScore = Math.Round(growthScore, 1),
            InfrastructureScore = Math.Round(infrastructureScore, 1),
            SafetyScore = Math.Round(safetyScore, 1),
            ConnectivityScore = Math.Round(connectivityScore, 1),
            AmenitiesScore = Math.Round(amenitiesScore, 1),
            Verdict = verdict,
            InvestmentOutlook = investmentOutlook
        };
    }

    public async Task<List<LocationInsight>> GetLocationInsightsAsync(string region, string district)
    {
        var insights = new List<LocationInsight>();

        UzbekistanRegion? regionEnum = null;
        if (!string.IsNullOrEmpty(region))
        {
            var normalizedRegion = region.Replace(" ", "").Replace("-", "");
            if (System.Enum.TryParse<UzbekistanRegion>(normalizedRegion, true, out var parsedRegion))
            {
                regionEnum = parsedRegion;
            }
        }

        var query = this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.District == district);

        if (regionEnum.HasValue)
        {
            query = query.Where(p => p.Region == regionEnum.Value);
        }

        var properties = await query.ToListAsync();

        if (!properties.Any())
            return insights;

        var avgPrice = properties.Where(p => p.SalePrice.HasValue).Average(p => p.SalePrice.GetValueOrDefault());
        var avgRating = properties.Average(p => p.AverageRating);
        var metroCount = properties.Count(p => p.HasMetroNearby);
        var schoolCount = properties.Count(p => p.HasSchoolNearby);
        var marketCount = properties.Count(p => p.HasMarketNearby);

        if (metroCount > properties.Count / 3)
            insights.Add(new LocationInsight { Type = "Pro", Title = "Metro yaqinligi", Description = "Hududning 30%+ metroga yaqin", ImpactScore = 8 });

        if (schoolCount > properties.Count / 4)
            insights.Add(new LocationInsight { Type = "Pro", Title = "Maktablar yaqin", Description = "Maktablarga qulay kirish", ImpactScore = 7 });

        if (marketCount > properties.Count / 3)
            insights.Add(new LocationInsight { Type = "Pro", Title = "Bozorlar yaqin", Description = "Oziq-ovqat do'konlariga qulay", ImpactScore = 6 });

        if (avgRating > 4.0m)
            insights.Add(new LocationInsight { Type = "Pro", Title = "Yuqori reyting", Description = "Aholining mavjud mulklardan mamnun", ImpactScore = 7 });

        if (metroCount < 5)
            insights.Add(new LocationInsight { Type = "Con", Title = "Uzoq transport", Description = "Metro stansiyalari uzoq", ImpactScore = -6 });

        if (avgPrice > 200000000m)
            insights.Add(new LocationInsight { Type = "Con", Title = "Yuqori narxlar", Description = "Hudud narxi o'rtachadan yuqori", ImpactScore = -5 });

        if (avgRating < 3.0m)
            insights.Add(new LocationInsight { Type = "Con", Title = "Past sifat", Description = "Mavjud mulklar past reytingli", ImpactScore = -7 });

        insights.Add(new LocationInsight { Type = "Fact", Title = "O'rtacha narx", Description = $"{avgPrice:N0} so'm", ImpactScore = 0 });
        insights.Add(new LocationInsight { Type = "Fact", Title = "Jami e'lonlar", Description = $"{properties.Count} ta mulk", ImpactScore = 0 });

        return insights.OrderByDescending(i => Math.Abs(i.ImpactScore)).ToList();
    }

    public async Task<object> GetDistrictComparisonAsync(string[] districts)
    {
        var results = new List<object>();

        foreach (var district in districts)
        {
            var score = await GetLocationScoreAsync("Toshkent", district);
            var insights = await GetLocationInsightsAsync("Toshkent", district);

            results.Add(new
            {
                district,
                overallScore = score.OverallScore,
                affordability = score.AffordabilityScore,
                infrastructure = score.InfrastructureScore,
                connectivity = score.ConnectivityScore,
                pros = insights.Where(i => i.Type == "Pro").Select(i => i.Title).ToList(),
                cons = insights.Where(i => i.Type == "Con").Select(i => i.Title).ToList()
            });
        }

        return results;
    }

    #endregion

    #region Price Intelligence

    public async Task<PricePrediction> PredictPriceAsync(Guid propertyId)
    {
        var property = await this.storageBroker.Properties
            .Where(p => p.Id == propertyId && !p.DeletedDate.HasValue)
            .Select(p => new
            {
                p.Id,
                p.Area,
                p.District,
                p.Type,
                p.HasWifi,
                p.HasParking,
                p.HasAirConditioning,
                p.HasFurniture,
                p.Floor,
                p.TotalFloors,
                p.NumberOfBedrooms,
                p.AverageRating
            })
            .FirstOrDefaultAsync();

        if (property == null)
            throw new Exception("Property not found");

        var comparables = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.District == property.District)
            .Where(p => p.Type == property.Type)
            .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
            .Select(p => new
            {
                p.SalePrice,
                p.Area,
                p.HasWifi,
                p.HasParking,
                p.HasAirConditioning,
                p.AverageRating
            })
            .ToListAsync();

        if (!comparables.Any())
        {
            return new PricePrediction
            {
                PropertyId = propertyId,
                Confidence = 0,
                PredictionBasis = "Ma'lumot yetarli emas"
            };
        }

        var avgPricePerSqm = comparables.Where(c => c.Area > 0)
            .Average(c => c.SalePrice.GetValueOrDefault() / (decimal)c.Area);

        var basePrice = avgPricePerSqm * (decimal)property.Area;

        var factors = new List<PriceFactor>();
        var adjustments = 0m;

        if (property.HasWifi)
        {
            var wifiAdj = basePrice * 0.02m;
            adjustments += wifiAdj;
            factors.Add(new PriceFactor { Name = "WiFi", Impact = 2, Description = "Internet mavjudligi" });
        }

        if (property.HasParking)
        {
            var parkingAdj = basePrice * 0.03m;
            adjustments += parkingAdj;
            factors.Add(new PriceFactor { Name = "Avtoturargoh", Impact = 3, Description = "Avtoturargoh mavjudligi" });
        }

        if (property.HasAirConditioning)
        {
            var acAdj = basePrice * 0.015m;
            adjustments += acAdj;
            factors.Add(new PriceFactor { Name = "Konditsioner", Impact = 1.5, Description = "AC mavjudligi" });
        }

        if (property.AverageRating > 4.0m)
        {
            var ratingAdj = basePrice * ((decimal)property.AverageRating - 3.0m) * 0.03m;
            adjustments += ratingAdj;
            factors.Add(new PriceFactor { Name = "Reyting", Impact = (double)(property.AverageRating - 3.0m) * 3, Description = "Yuqori reyting" });
        }

        var predictedPrice = basePrice + adjustments;
        var confidence = Math.Min(95, 40 + comparables.Count * 5);

        var rangePercent = (100 - confidence) / 10;
        var minPrice = predictedPrice * (1 - rangePercent / 100);
        var maxPrice = predictedPrice * (1 + rangePercent / 100);

        return new PricePrediction
        {
            PropertyId = propertyId,
            PredictedPrice = predictedPrice,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Confidence = confidence,
            PredictionBasis = $"{comparables.Count} ta o'xshash mulk asosida",
            Factors = factors
        };
    }

    public async Task<PriceTrendForecast> GetPriceForecastAsync(string region, string district, int months = 6)
    {
        UzbekistanRegion? regionEnum = null;
        if (!string.IsNullOrEmpty(region))
        {
            var normalizedRegion = region.Replace(" ", "").Replace("-", "");
            if (System.Enum.TryParse<UzbekistanRegion>(normalizedRegion, true, out var parsedRegion))
            {
                regionEnum = parsedRegion;
            }
        }

        var query = this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.District == district);

        if (regionEnum.HasValue)
        {
            query = query.Where(p => p.Region == regionEnum.Value);
        }

        var historicalData = await query
            .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
            .Where(p => p.CreatedDate >= DateTimeOffset.UtcNow.AddMonths(-6))
            .GroupBy(p => new { p.CreatedDate.Year, p.CreatedDate.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                AvgPrice = g.Average(p => p.SalePrice.GetValueOrDefault()),
                Count = g.Count()
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        if (historicalData.Count < 2)
        {
            return new PriceTrendForecast
            {
                Region = region,
                District = district,
                TrendDirection = "Unknown",
                Recommendation = "Yetarli tarixiy ma'lumot yo'q"
            };
        }

        var firstMonth = historicalData.First();
        var lastMonth = historicalData.Last();
        var overallTrendPercent = (double)((lastMonth.AvgPrice - firstMonth.AvgPrice) / firstMonth.AvgPrice * 100);

        var forecasts = new List<MonthlyForecast>();
        var currentPrice = lastMonth.AvgPrice;
        var monthlyChange = overallTrendPercent / historicalData.Count;

        for (int i = 1; i <= months; i++)
        {
            var forecastDate = DateTimeOffset.UtcNow.AddMonths(i);
            var predictedChange = monthlyChange * i;
            var predictedPrice = currentPrice * (1 + (decimal)predictedChange / 100);

            forecasts.Add(new MonthlyForecast
            {
                Month = $"{forecastDate:yyyy-MM}",
                PredictedAvgPrice = predictedPrice,
                ChangePercent = predictedChange,
                Confidence = Math.Max(50, 90 - i * 5)
            });
        }

        var trendDirection = overallTrendPercent switch
        {
            > 5 => "Rising",
            < -5 => "Falling",
            _ => "Stable"
        };

        var recommendation = trendDirection switch
        {
            "Rising" => "📈 Narxlari oshayotgan hudud. Xarid qilish uchun qulay vaqt.",
            "Falling" => "📉 Narxlari tushayotgan hudud. Sotib olishdan oldin kuting.",
            _ => "📊 Barqaror narxlar. O'z vaqtida xarid qilishingiz mumkin."
        };

        return new PriceTrendForecast
        {
            Region = region,
            District = district,
            Forecasts = forecasts,
            OverallTrendPercent = overallTrendPercent,
            TrendDirection = trendDirection,
            Recommendation = recommendation
        };
    }

    #endregion
}
