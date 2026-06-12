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
    public async Task<PricePrediction> PredictPriceAsync(Guid propertyId)
    {
        var property = await this.storageBroker.SelectAllProperties()
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

        var comparables = await this.storageBroker.SelectAllProperties()
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

        var query = this.storageBroker.SelectAllProperties()
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

}

