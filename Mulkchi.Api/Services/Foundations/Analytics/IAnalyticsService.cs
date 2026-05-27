using System.Threading.Tasks;

namespace Mulkchi.Api.Services.Foundations.Analytics;

public interface IAnalyticsService
{
    Task<object> GetMarketOverviewAsync();
    Task<object> GetAnalyticsByRegionAsync();
    Task<object> GetAnalyticsByDistrictAsync();
    Task<object> GetPriceTrendsAsync();
    Task<object> GetDistrictPriceRangesAsync();
    Task<object> GetAiRecommendationAccuracyAsync();
    Task<object> GetPropertyPriceHeatmapAsync();

    Task<PropertyAnalysisResult> AnalyzePropertyAsync(Guid propertyId);
    Task<List<PropertyDealScore>> FindBestDealsAsync(int limit = 10);
    Task<List<PropertyDealScore>> FindHighRoiPropertiesAsync(int limit = 10);
    Task<List<PropertyDealScore>> FindFastSellingPropertiesAsync(int limit = 10);

    Task<LocationScore> GetLocationScoreAsync(string region, string district);
    Task<List<LocationInsight>> GetLocationInsightsAsync(string region, string district);
    Task<object> GetDistrictComparisonAsync(string[] districts);

    Task<PricePrediction> PredictPriceAsync(Guid propertyId);
    Task<PriceTrendForecast> GetPriceForecastAsync(string region, string district, int months = 6);
}
