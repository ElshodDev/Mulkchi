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
    public async Task<PropertyAnalysisResult> AnalyzePropertyAsync(Guid propertyId)
    {
        var property = await this.storageBroker.SelectAllProperties()
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

        var comparables = await this.storageBroker.SelectAllProperties()
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
        var properties = await this.storageBroker.SelectAllProperties()
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
            var districtAvg = await this.storageBroker.SelectAllProperties()
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
        var properties = await this.storageBroker.SelectAllProperties()
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

        var properties = await this.storageBroker.SelectAllProperties()
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



}

