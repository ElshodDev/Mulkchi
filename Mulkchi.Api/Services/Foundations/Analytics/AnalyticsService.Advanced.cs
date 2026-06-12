using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.AI;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Mulkchi.Api.Services.Foundations.Analytics;


public partial class AnalyticsService
{
    public async Task<object> GetDistrictPriceRangesAsync()
    {
        var rawPrices = await this.storageBroker.SelectAllProperties()
            .Where(p => !p.DeletedDate.HasValue && !string.IsNullOrEmpty(p.District))
            .Select(p => new { p.District, p.SalePrice, p.MonthlyRent, p.Type })
            .ToListAsync();

        var priceRanges = new List<object>();
        var groupedByDistrict = rawPrices.GroupBy(p => p.District);

        foreach (var group in groupedByDistrict)
        {
            var district = group.Key;
            var salePrices = group.Where(p => p.SalePrice.HasValue && p.SalePrice > 0).Select(p => (decimal)p.SalePrice.GetValueOrDefault()).ToList();
            var rentPrices = group.Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0).Select(p => (decimal)p.MonthlyRent.GetValueOrDefault()).ToList();

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
                propertyTypes = group
                    .GroupBy(p => p.Type)
                    .Select(g => new
                    {
                        type = g.Key.ToString(),
                        count = g.Count(),
                        averagePrice = g.Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                            .Average(p => (decimal?)p.SalePrice) ?? 0m
                    })
                    .ToList()
            };

            priceRanges.Add(priceRange);
        }

        return priceRanges.OrderByDescending(r => ((dynamic)r).salePriceRange.count).ToList();
    }

    public async Task<object> GetAiRecommendationAccuracyAsync()
    {
        var recommendations = await this.storageBroker.SelectAllAiRecommendations()
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

        var propertiesWithRecommendations = await this.storageBroker.SelectAllProperties()
            .Where(p => !p.DeletedDate.HasValue && p.SalePrice.HasValue)
            .Join(
                this.storageBroker.SelectAllAiRecommendations().Where(r => !r.DeletedDate.HasValue),
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
        var properties = await this.storageBroker.SelectAllProperties()
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


}

