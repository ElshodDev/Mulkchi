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
    private readonly IUserService userService;
    private readonly IPaymentService paymentService;
    private readonly IDiscountService discountService;
    private readonly IAiRecommendationService aiRecommendationService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        IPriceRecommendationService priceRecommendationService,
        IPropertyService propertyService,
        IBookingService bookingService,
        IUserService userService,
        IPaymentService paymentService,
        IDiscountService discountService,
        IAiRecommendationService aiRecommendationService,
        ILogger<AnalyticsController> logger)
    {
        this.analyticsService = analyticsService;
        this.priceRecommendationService = priceRecommendationService;
        this.propertyService = propertyService;
        this.bookingService = bookingService;
        this.userService = userService;
        this.paymentService = paymentService;
        this.discountService = discountService;
        this.aiRecommendationService = aiRecommendationService;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetDashboard([FromQuery] DateTimeOffset? startDate = null, [FromQuery] DateTimeOffset? endDate = null)
    {
        try
        {
            DateTimeOffset from = startDate ?? DateTimeOffset.UtcNow.AddDays(-30);
            DateTimeOffset to = endDate ?? DateTimeOffset.UtcNow;

            var properties = this.propertyService.RetrieveAllProperties().Where(property => !property.DeletedDate.HasValue);
            var bookings = this.bookingService.RetrieveAllBookings().Where(booking => !booking.DeletedDate.HasValue);
            var users = this.userService.RetrieveAllUsers().Where(user => !user.DeletedDate.HasValue);
            var payments = this.paymentService.RetrieveAllPayments().Where(payment => !payment.DeletedDate.HasValue);

            int totalProperties = properties.Count();
            int totalBookings = bookings.Count();
            int totalUsers = users.Count();
            decimal totalRevenue = payments.Where(payment => payment.Status == Models.Foundations.Payments.PaymentStatus.Completed).Sum(payment => (decimal?)payment.Amount) ?? 0;

            var marketOverviewObj = await this.analyticsService.GetMarketOverviewAsync();
            var regionObj = await this.analyticsService.GetAnalyticsByRegionAsync();
            var priceTrendsObj = await this.analyticsService.GetPriceTrendsAsync();
            var recommendationQuery = this.aiRecommendationService.RetrieveAllAiRecommendations();

            var regionStats = (regionObj as IEnumerable<object>)?.ToList() ?? new List<object>();
            var priceTrends = (priceTrendsObj as IEnumerable<object>)?.ToList() ?? new List<object>();

            int totalRecommendations = recommendationQuery.Count();
            int viewedRecommendations = recommendationQuery.Count(recommendation => recommendation.IsActedUpon);
            int clickedRecommendations = viewedRecommendations;
            decimal clickThroughRate = totalRecommendations > 0
                ? (decimal)clickedRecommendations / totalRecommendations
                : 0m;
            decimal recommendationConversionRate = totalRecommendations > 0
                ? (decimal)viewedRecommendations / totalRecommendations
                : 0m;

            var propertyTitleById = properties.ToDictionary(property => property.Id, property => property.Title);

            var topRecommendationTypes = recommendationQuery
                .GroupBy(recommendation => recommendation.Type)
                .Select(group => new
                {
                    type = group.Key.ToString(),
                    count = group.Count(),
                    clickRate = group.Count() > 0
                        ? (decimal)group.Count(item => item.IsActedUpon) / group.Count()
                        : 0m,
                    conversionRate = group.Count() > 0
                        ? (decimal)group.Count(item => item.IsActedUpon) / group.Count()
                        : 0m,
                    averageScore = group.Average(item => item.Score)
                })
                .OrderByDescending(item => item.count)
                .Take(5)
                .ToArray();

            var recommendationPerformance = recommendationQuery
                .Where(recommendation => recommendation.PropertyId.HasValue)
                .GroupBy(recommendation => recommendation.PropertyId!.Value)
                .Select(group => new
                {
                    propertyId = group.Key,
                    propertyTitle = propertyTitleById.ContainsKey(group.Key)
                        ? propertyTitleById[group.Key]
                        : "Unknown",
                    recommendationsCount = group.Count(),
                    clicksCount = group.Count(item => item.IsActedUpon),
                    bookingsCount = 0,
                    conversionRate = group.Count() > 0
                        ? (decimal)group.Count(item => item.IsActedUpon) / group.Count()
                        : 0m,
                    revenue = 0m
                })
                .OrderByDescending(item => item.recommendationsCount)
                .Take(10)
                .ToArray();

            int variantACount = recommendationQuery.Count(recommendation =>
                recommendation.Metadata != null && recommendation.Metadata.Contains("\"abVariant\":\"A\""));
            int variantBCount = recommendationQuery.Count(recommendation =>
                recommendation.Metadata != null && recommendation.Metadata.Contains("\"abVariant\":\"B\""));

            int variantAClicks = recommendationQuery.Count(recommendation =>
                recommendation.IsActedUpon && recommendation.Metadata != null && recommendation.Metadata.Contains("\"abVariant\":\"A\""));
            int variantBClicks = recommendationQuery.Count(recommendation =>
                recommendation.IsActedUpon && recommendation.Metadata != null && recommendation.Metadata.Contains("\"abVariant\":\"B\""));

            var dashboard = new
            {
                overview = new
                {
                    totalRevenue,
                    totalUsers,
                    totalProperties,
                    totalBookings,
                    monthlyGrowth = new { revenue = 0m, users = 0m, properties = 0m, bookings = 0m },
                    yearlyGrowth = new { revenue = 0m, users = 0m, properties = 0m, bookings = 0m }
                },
                revenue = new
                {
                    monthlyRevenue = priceTrends.Select(item => new
                    {
                        month = item.GetType().GetProperty("month")?.GetValue(item)?.ToString() ?? string.Empty,
                        revenue = totalRevenue,
                        bookingsCount = totalBookings,
                        averageValue = totalBookings > 0 ? totalRevenue / totalBookings : 0,
                        growth = 0m
                    }),
                    yearlyRevenue = new[]
                    {
                        new { year = DateTimeOffset.UtcNow.Year, revenue = totalRevenue, bookingsCount = totalBookings, growth = 0m }
                    },
                    revenueByRegion = regionStats.Select(item => new
                    {
                        region = item.GetType().GetProperty("region")?.GetValue(item)?.ToString() ?? "Unknown",
                        revenue = totalRevenue,
                        bookingsCount = 0,
                        percentage = 0m
                    }),
                    revenueByPropertyType = Array.Empty<object>(),
                    averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0,
                    totalDiscountAmount = this.discountService.RetrieveAllDiscounts().Sum(discount => (decimal?)discount.Value) ?? 0,
                    projectedRevenue = totalRevenue
                },
                users = new
                {
                    userGrowth = new[]
                    {
                        new { date = from.ToString("yyyy-MM-dd"), totalUsers, newUsers = 0, activeUsers = totalUsers, growth = 0m }
                    },
                    userDemographics = new
                    {
                        byRegion = users.GroupBy(user => string.IsNullOrWhiteSpace(user.Address) ? "Unknown" : user.Address).Select(group => new { region = group.Key, count = group.Count(), percentage = totalUsers > 0 ? (decimal)group.Count() / totalUsers : 0m }),
                        byAge = Array.Empty<object>(),
                        byRole = users.GroupBy(user => user.Role.ToString()).Select(group => new { role = group.Key, count = group.Count(), percentage = totalUsers > 0 ? (decimal)group.Count() / totalUsers : 0m })
                    },
                    userActivity = new { dailyActiveUsers = totalUsers, weeklyActiveUsers = totalUsers, monthlyActiveUsers = totalUsers, averageSessionDuration = 0, bounceRate = 0m },
                    userRetention = Array.Empty<object>(),
                    userSegmentation = Array.Empty<object>()
                },
                properties = new
                {
                    propertyGrowth = new[] { new { date = from.ToString("yyyy-MM-dd"), totalProperties, newProperties = 0, activeProperties = totalProperties } },
                    topViewedProperties = properties.OrderByDescending(property => property.ViewsCount).Take(10).Select(property => new { id = property.Id, title = property.Title, viewsCount = property.ViewsCount, bookingsCount = 0, revenue = 0m, rating = property.AverageRating, city = property.City, propertyType = property.Type.ToString() }),
                    topBookedProperties = Array.Empty<object>(),
                    propertyPerformance = Array.Empty<object>(),
                    propertyTypeDistribution = properties.GroupBy(property => property.Type.ToString()).Select(group => new { propertyType = group.Key, count = group.Count(), percentage = totalProperties > 0 ? (decimal)group.Count() / totalProperties : 0m, averagePrice = group.Average(property => property.MonthlyRent ?? property.SalePrice ?? property.PricePerNight ?? 0m), averageOccupancy = 0m })
                },
                bookings = new
                {
                    bookingTrends = new[] { new { date = from.ToString("yyyy-MM-dd"), bookingsCount = totalBookings, revenue = totalRevenue, averageValue = totalBookings > 0 ? totalRevenue / totalBookings : 0m, cancellationRate = 0m } },
                    bookingByRegion = regionStats.Select(item => new { region = item.GetType().GetProperty("region")?.GetValue(item)?.ToString() ?? "Unknown", bookingsCount = 0, revenue = 0m, averageValue = 0m, growth = 0m }),
                    bookingByPropertyType = Array.Empty<object>(),
                    bookingConversion = Array.Empty<object>(),
                    seasonalTrends = Array.Empty<object>()
                },
                views = new
                {
                    totalViews = properties.Sum(property => property.ViewsCount),
                    uniqueViews = properties.Sum(property => property.ViewsCount),
                    viewsByProperty = properties.OrderByDescending(property => property.ViewsCount).Take(10).Select(property => new { propertyId = property.Id, title = property.Title, viewsCount = property.ViewsCount, uniqueViews = property.ViewsCount, averageViewDuration = 0, bookingConversionRate = 0m }),
                    viewsByRegion = regionStats.Select(item => new { region = item.GetType().GetProperty("region")?.GetValue(item)?.ToString() ?? "Unknown", viewsCount = 0, uniqueViews = 0, averageViewDuration = 0, bookingConversionRate = 0m }),
                    viewsByDevice = Array.Empty<object>(),
                    viewTrends = Array.Empty<object>()
                },
                recommendations = new
                {
                    totalRecommendations,
                    viewedRecommendations,
                    clickedRecommendations,
                    conversionRate = recommendationConversionRate,
                    clickThroughRate,
                    topRecommendationTypes,
                    recommendationPerformance,
                    abTestPerformance = new
                    {
                        variantA = new
                        {
                            count = variantACount,
                            ctr = variantACount > 0 ? (decimal)variantAClicks / variantACount : 0m
                        },
                        variantB = new
                        {
                            count = variantBCount,
                            ctr = variantBCount > 0 ? (decimal)variantBClicks / variantBCount : 0m
                        }
                    },
                    userEngagement = new
                    {
                        averageViewTime = 0,
                        clickThroughRate,
                        bounceRate = 0m,
                        engagementScore = clickThroughRate
                    }
                },
                marketOverview = marketOverviewObj
            };

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
    [Authorize(Roles = "Admin")]
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
    [Authorize(Roles = "Admin")]
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
    [Authorize(Roles = "Admin")]
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

    /// <summary>
    /// Analyze a property to determine if it's overpriced or underpriced
    /// </summary>
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

    /// <summary>
    /// Get best deals - properties significantly below market price
    /// </summary>
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

    /// <summary>
    /// Get high ROI properties - good for rental investment
    /// </summary>
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

    /// <summary>
    /// Get fast selling properties - high demand indicators
    /// </summary>
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

    /// <summary>
    /// Get all smart filters in one call
    /// </summary>
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

    /// <summary>
    /// Get location living score and metrics
    /// </summary>
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

    /// <summary>
    /// Get detailed insights about a location
    /// </summary>
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

    /// <summary>
    /// Compare multiple districts
    /// </summary>
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

    /// <summary>
    /// Predict property price based on market data
    /// </summary>
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

    /// <summary>
    /// Get price trend forecast for a location
    /// </summary>
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
