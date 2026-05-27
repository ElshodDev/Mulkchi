using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Services.Foundations.Bookings;
using Mulkchi.Api.Services.Foundations.Discounts;
using Mulkchi.Api.Services.Foundations.Payments;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.AI;
using Mulkchi.Api.Services.Foundations.Analytics;
using Mulkchi.Api.Services.Foundations.AiRecommendations;
using Mulkchi.Api.Services.Foundations.Users;
using System.Collections.Generic;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService analyticsService;
    private readonly IPriceRecommendationService priceRecommendationService;
    private readonly IPropertyService propertyService;
    private readonly IBookingService bookingService;
    private readonly IDashboardAnalyticsService dashboardAnalyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        IPriceRecommendationService priceRecommendationService,
        IPropertyService propertyService,
        IBookingService bookingService,
        IDashboardAnalyticsService dashboardAnalyticsService,
        ILogger<AnalyticsController> logger)
    {
        this.analyticsService = analyticsService;
        this.priceRecommendationService = priceRecommendationService;
        this.propertyService = propertyService;
        this.bookingService = bookingService;
        this.dashboardAnalyticsService = dashboardAnalyticsService;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult> GetDashboard([FromQuery] DateTimeOffset? startDate = null, [FromQuery] DateTimeOffset? endDate = null)
    {
        try
        {
            var dashboard = await this.dashboardAnalyticsService.GetDashboardAsync(startDate, endDate);
            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetDashboard));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("host-dashboard")]
    [Authorize]
    public ActionResult GetHostDashboard()
    {
        try
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("id");
            if (string.IsNullOrEmpty(currentUserIdStr) || !Guid.TryParse(currentUserIdStr, out Guid userId))
                return Unauthorized(new { message = "User not authorized or ID not found." });

            var properties = this.propertyService.RetrieveAllProperties().Where(p => p.HostId == userId && !p.DeletedDate.HasValue).ToList();
            var propertyIds = properties.Select(p => p.Id).ToList();
            var bookings = this.bookingService.RetrieveAllBookings().Where(b => propertyIds.Contains(b.PropertyId) && !b.DeletedDate.HasValue).ToList();

            int totalListings = properties.Count;
            int totalViews = properties.Sum(p => p.ViewsCount);
            int totalBookings = bookings.Count;

            decimal averageRating = totalListings > 0
                ? (decimal)properties.Average(p => (double)p.AverageRating)
                : 0m;

            decimal totalRevenue = bookings
                .Where(b => b.Status == Models.Foundations.Bookings.BookingStatus.Confirmed || b.Status == Models.Foundations.Bookings.BookingStatus.Completed)
                .Sum(b => b.TotalPrice);

            return Ok(new
            {
                totalListings,
                totalViews,
                totalBookings,
                averageRating = Math.Round(averageRating, 1),
                totalRevenue
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetHostDashboard));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("export/{type}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public ActionResult ExportDashboard(string type, [FromQuery] string format = "csv")
    {
        try
        {
            var csv = new StringBuilder();
            csv.AppendLine("metric,value");
            csv.AppendLine($"exportType,{type}");
            csv.AppendLine($"generatedAt,{DateTimeOffset.UtcNow:O}");

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            var contentType = format.Equals("pdf", StringComparison.OrdinalIgnoreCase)
                ? "application/pdf"
                : format.Equals("excel", StringComparison.OrdinalIgnoreCase)
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "text/csv";

            var extension = format.Equals("pdf", StringComparison.OrdinalIgnoreCase)
                ? "pdf"
                : format.Equals("excel", StringComparison.OrdinalIgnoreCase)
                    ? "xlsx"
                    : "csv";

            return File(bytes, contentType, $"analytics-{type}.{extension}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(ExportDashboard));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("market-overview")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult> GetMarketOverview()
    {
        try
        {
            var overview = await this.analyticsService.GetMarketOverviewAsync();
            return Ok(overview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetMarketOverview));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("by-region")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult> GetAnalyticsByRegion()
    {
        try
        {
            var regionData = await this.analyticsService.GetAnalyticsByRegionAsync();
            return Ok(regionData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetAnalyticsByRegion));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("price-trends")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult> GetPriceTrends()
    {
        try
        {
            var trends = await this.analyticsService.GetPriceTrendsAsync();
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetPriceTrends));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("by-district")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult> GetAnalyticsByDistrict()
    {
        try
        {
            var districtData = await this.analyticsService.GetAnalyticsByDistrictAsync();
            return Ok(districtData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetAnalyticsByDistrict));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("district-price-ranges")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult> GetDistrictPriceRanges()
    {
        try
        {
            var priceRanges = await this.analyticsService.GetDistrictPriceRangesAsync();
            return Ok(priceRanges);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetDistrictPriceRanges));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("ai-recommendation-accuracy")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult> GetAiRecommendationAccuracy()
    {
        try
        {
            var accuracy = await this.analyticsService.GetAiRecommendationAccuracyAsync();
            return Ok(accuracy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetAiRecommendationAccuracy));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("price-heatmap")]
    public async Task<ActionResult> GetPropertyPriceHeatmap()
    {
        try
        {
            var heatmap = await this.analyticsService.GetPropertyPriceHeatmapAsync();
            return Ok(heatmap);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetPropertyPriceHeatmap));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpPost("predict-price")]
    public async Task<ActionResult<PriceRecommendationResponse>> PredictPrice(PriceRecommendationRequest request)
    {
        try
        {
            var prediction = await this.priceRecommendationService.PredictPriceAsync(request);
            return Ok(prediction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(PredictPrice));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpPost("train-model")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult> TrainModel()
    {
        try
        {
            await this.priceRecommendationService.TrainModelAsync();
            return Ok(new { message = "Model training completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(TrainModel));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("model-status")]
    public async Task<ActionResult> GetModelStatus()
    {
        try
        {
            var isTrained = await this.priceRecommendationService.IsModelTrainedAsync();
            var trainingDataCount = await this.priceRecommendationService.GetTrainingDataCountAsync();

            return Ok(new
            {
                isTrained,
                trainingDataCount,
                minimumRequiredData = 10,
                needsTraining = trainingDataCount >= 10 && !isTrained
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetModelStatus));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    #region Smart Property Analysis

    [HttpGet("property-analysis/{propertyId}")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<PropertyAnalysisResult>> AnalyzeProperty(Guid propertyId)
    {
        try
        {
            var analysis = await this.analyticsService.AnalyzePropertyAsync(propertyId);
            return Ok(analysis);
        }
        catch (Exception ex) when (ex.Message == "Property not found")
        {
            return NotFound(new { message = "Property not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing property {PropertyId}", propertyId);
            return StatusCode(500, new { message = "Failed to analyze property" });
        }
    }

    [HttpGet("smart-filters/best-deals")]
    [ResponseCache(Duration = 600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<List<PropertyDealScore>>> GetBestDeals([FromQuery] int limit = 10)
    {
        try
        {
            var deals = await this.analyticsService.FindBestDealsAsync(limit);
            return Ok(deals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding best deals");
            return StatusCode(500, new { message = "Failed to find best deals" });
        }
    }

    [HttpGet("smart-filters/high-roi")]
    [ResponseCache(Duration = 600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<List<PropertyDealScore>>> GetHighRoiProperties([FromQuery] int limit = 10)
    {
        try
        {
            var properties = await this.analyticsService.FindHighRoiPropertiesAsync(limit);
            return Ok(properties);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding high ROI properties");
            return StatusCode(500, new { message = "Failed to find high ROI properties" });
        }
    }

    [HttpGet("smart-filters/fast-selling")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<List<PropertyDealScore>>> GetFastSellingProperties([FromQuery] int limit = 10)
    {
        try
        {
            var properties = await this.analyticsService.FindFastSellingPropertiesAsync(limit);
            return Ok(properties);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding fast selling properties");
            return StatusCode(500, new { message = "Failed to find fast selling properties" });
        }
    }

    [HttpGet("smart-filters/all")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult> GetAllSmartFilters([FromQuery] int limit = 10)
    {
        try
        {
            var bestDeals = await this.analyticsService.FindBestDealsAsync(limit);
            var highRoi = await this.analyticsService.FindHighRoiPropertiesAsync(limit);
            var fastSelling = await this.analyticsService.FindFastSellingPropertiesAsync(limit);

            return Ok(new
            {
                bestDeals,
                highRoi,
                fastSelling,
                summary = new
                {
                    bestDealsCount = bestDeals.Count,
                    highRoiCount = highRoi.Count,
                    fastSellingCount = fastSelling.Count,
                    generatedAt = DateTimeOffset.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting smart filters");
            return StatusCode(500, new { message = "Failed to get smart filters" });
        }
    }

    #endregion

    #region Location Intelligence

    [HttpGet("location-score")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<LocationScore>> GetLocationScore(
        [FromQuery] string region,
        [FromQuery] string district)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(region) || string.IsNullOrWhiteSpace(district))
            {
                return BadRequest(new { message = "Region and district are required" });
            }

            var score = await this.analyticsService.GetLocationScoreAsync(region, district);
            return Ok(score);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location score for {Region}, {District}", region, district);
            return StatusCode(500, new { message = "Failed to get location score" });
        }
    }

    [HttpGet("location-insights")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<List<LocationInsight>>> GetLocationInsights(
        [FromQuery] string region,
        [FromQuery] string district)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(region) || string.IsNullOrWhiteSpace(district))
            {
                return BadRequest(new { message = "Region and district are required" });
            }

            var insights = await this.analyticsService.GetLocationInsightsAsync(region, district);
            return Ok(insights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location insights for {Region}, {District}", region, district);
            return StatusCode(500, new { message = "Failed to get location insights" });
        }
    }

    [HttpPost("district-comparison")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult> CompareDistricts([FromBody] string[] districts)
    {
        try
        {
            if (districts == null || districts.Length < 2)
            {
                return BadRequest(new { message = "At least 2 districts are required for comparison" });
            }

            var comparison = await this.analyticsService.GetDistrictComparisonAsync(districts);
            return Ok(comparison);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comparing districts");
            return StatusCode(500, new { message = "Failed to compare districts" });
        }
    }

    #endregion

    #region Price Intelligence

    [HttpGet("price-prediction/{propertyId}")]
    [ResponseCache(Duration = 600, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<PricePrediction>> PredictPropertyPrice(Guid propertyId)
    {
        try
        {
            var prediction = await this.analyticsService.PredictPriceAsync(propertyId);
            return Ok(prediction);
        }
        catch (Exception ex) when (ex.Message == "Property not found")
        {
            return NotFound(new { message = "Property not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error predicting price for property {PropertyId}", propertyId);
            return StatusCode(500, new { message = "Failed to predict price" });
        }
    }

    [HttpGet("price-forecast")]
    [ResponseCache(Duration = 1800, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<PriceTrendForecast>> GetPriceForecast(
        [FromQuery] string region,
        [FromQuery] string district,
        [FromQuery] int months = 6)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(region) || string.IsNullOrWhiteSpace(district))
            {
                return BadRequest(new { message = "Region and district are required" });
            }

            var forecast = await this.analyticsService.GetPriceForecastAsync(region, district, months);
            return Ok(forecast);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price forecast for {Region}, {District}", region, district);
            return StatusCode(500, new { message = "Failed to get price forecast" });
        }
    }

    #endregion
}
