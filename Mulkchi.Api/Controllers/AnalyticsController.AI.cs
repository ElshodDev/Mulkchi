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

    [HttpGet("fraud-risk/{propertyId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<FraudAssessmentResult>> GetFraudRisk(Guid propertyId)
    {
        try
        {
            var riskAssessment = await this.propertyFraudDetectionService.AssessPropertyRiskByIdAsync(propertyId);
            return Ok(riskAssessment);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Property with ID '{propertyId}' not found." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetFraudRisk));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }
}


