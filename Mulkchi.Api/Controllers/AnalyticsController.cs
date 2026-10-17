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
public partial class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService analyticsService;
    private readonly IPriceRecommendationService priceRecommendationService;
    private readonly IPropertyService propertyService;
    private readonly IBookingService bookingService;
    private readonly IDashboardAnalyticsService dashboardAnalyticsService;
    private readonly IPropertyFraudDetectionService propertyFraudDetectionService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        IPriceRecommendationService priceRecommendationService,
        IPropertyService propertyService,
        IBookingService bookingService,
        IDashboardAnalyticsService dashboardAnalyticsService,
        IPropertyFraudDetectionService propertyFraudDetectionService,
        ILogger<AnalyticsController> logger)
    {
        this.analyticsService = analyticsService;
        this.priceRecommendationService = priceRecommendationService;
        this.propertyService = propertyService;
        this.bookingService = bookingService;
        this.dashboardAnalyticsService = dashboardAnalyticsService;
        this.propertyFraudDetectionService = propertyFraudDetectionService;
        _logger = logger;
    }

}
