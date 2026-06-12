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

}



