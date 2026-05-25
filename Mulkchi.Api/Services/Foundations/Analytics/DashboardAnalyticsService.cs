using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Mulkchi.Api.Services.Foundations.AiRecommendations;
using Mulkchi.Api.Services.Foundations.Bookings;
using Mulkchi.Api.Services.Foundations.Discounts;
using Mulkchi.Api.Services.Foundations.Payments;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Users;
using Mulkchi.Api.Services.Foundations.AI;

namespace Mulkchi.Api.Services.Foundations.Analytics;

public class DashboardAnalyticsService : IDashboardAnalyticsService
{
    private readonly IAnalyticsService analyticsService;
    private readonly IPropertyService propertyService;
    private readonly IBookingService bookingService;
    private readonly IUserService userService;
    private readonly IPaymentService paymentService;
    private readonly IDiscountService discountService;
    private readonly IAiRecommendationService aiRecommendationService;

    public DashboardAnalyticsService(
        IAnalyticsService analyticsService,
        IPropertyService propertyService,
        IBookingService bookingService,
        IUserService userService,
        IPaymentService paymentService,
        IDiscountService discountService,
        IAiRecommendationService aiRecommendationService)
    {
        this.analyticsService = analyticsService;
        this.propertyService = propertyService;
        this.bookingService = bookingService;
        this.userService = userService;
        this.paymentService = paymentService;
        this.discountService = discountService;
        this.aiRecommendationService = aiRecommendationService;
    }

    public async Task<object> GetDashboardAsync(DateTimeOffset? startDate, DateTimeOffset? endDate)
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

        return dashboard;
    }
}
