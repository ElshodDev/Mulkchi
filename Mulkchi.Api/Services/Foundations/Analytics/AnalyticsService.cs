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

        // Bugungi yangi e'lonlar
        var newListingsToday = await properties
            .CountAsync(p => p.CreatedDate.Date == today);

        // Kechagi yangi e'lonlar (taqqoslash uchun)
        var newListingsYesterday = await properties
            .CountAsync(p => p.CreatedDate.Date == yesterday);

        // Oxirgi 7 kunlik o'rtacha
        var lastWeek = today.AddDays(-7);
        var avgNewListingsPerDay = await properties
            .Where(p => p.CreatedDate.Date >= lastWeek && p.CreatedDate.Date < today)
            .GroupBy(p => p.CreatedDate.Date)
            .Select(g => g.Count())
            .AverageAsync();

        // Eng faol shahar
        var topCity = await properties
            .GroupBy(p => p.City)
            .Select(g => new { City = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync();

        // Oylik o'rtacha kvadrat metr narxi
        var averagePricePerSqm = await properties
            .Where(p => p.SalePrice.HasValue && p.SalePrice > 0 && p.Area > 0)
            .Select(p => p.SalePrice.Value / (decimal)p.Area)
            .AverageAsync();

        // Sotish va ijara narxlarining o'rtacha farqi
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
                .Select(p => p.SalePrice.Value)
                .ToListAsync();

            var rentPrices = await properties
                .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                .Select(p => p.MonthlyRent.Value)
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

        // Group by recommendation type
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

        // A/B test performance
        var variantA = recommendations.Count(r =>
            r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"A\""));
        var variantB = recommendations.Count(r =>
            r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"B\""));
        var variantAClicks = recommendations.Count(r =>
            r.IsActedUpon && r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"A\""));
        var variantBClicks = recommendations.Count(r =>
            r.IsActedUpon && r.Metadata != null && r.Metadata.Contains("\"abVariant\":\"B\""));

        // Price prediction accuracy (compare predicted vs actual sale prices)
        var propertiesWithRecommendations = await this.storageBroker.Properties
            .Where(p => !p.DeletedDate.HasValue && p.SalePrice.HasValue)
            .Join(
                this.storageBroker.AiRecommendations.Where(r => !r.DeletedDate.HasValue),
                p => p.Id,
                r => r.PropertyId,
                (p, r) => new { Property = p, Recommendation = r })
            .ToListAsync();

        // Calculate accuracy based on recommendation score correlation with actual sales
        var priceAccuracy = propertiesWithRecommendations
            .Where(x => x.Property.SalePrice.HasValue)
            .Select(x => new
            {
                propertyId = x.Property.Id,
                actualPrice = x.Property.SalePrice.Value,
                score = x.Recommendation.Score,
                // Higher score should correlate with successful sales
                isAccurate = x.Recommendation.Score >= 0.7m // Threshold for "accurate" recommendation
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
        // Get all properties with location and price data
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

        // Group by grid cells (approximate 0.01 degree grid ~ 1km)
        var heatmapData = properties
            .GroupBy(p => new
            {
                LatGrid = System.Math.Round(p.Latitude.Value, 2),
                LngGrid = System.Math.Round(p.Longitude.Value, 2)
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
                density = g.Count() / (0.01 * 0.01) // Approximate properties per sq km
            })
            .OrderByDescending(h => h.density)
            .ToList();

        // Calculate price percentiles for coloring
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
}
