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

public partial class AnalyticsController : ControllerBase
{
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

}



