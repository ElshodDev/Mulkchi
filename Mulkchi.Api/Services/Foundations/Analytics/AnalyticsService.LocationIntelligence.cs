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

        var query = this.storageBroker.SelectAllProperties()
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

        var query = this.storageBroker.SelectAllProperties()
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



}

