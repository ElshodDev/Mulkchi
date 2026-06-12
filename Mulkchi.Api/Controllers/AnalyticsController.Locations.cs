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



}



