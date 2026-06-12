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
}


