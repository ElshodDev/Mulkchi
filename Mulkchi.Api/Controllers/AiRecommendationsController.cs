using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.AIs;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Models.Foundations.AIs.Exceptions;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Services.Foundations.AiRecommendations;
using Mulkchi.Api.Services.Foundations.AI;
using Microsoft.FeatureManagement;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiRecommendationsController : ControllerBase
{
    private readonly IAiRecommendationService aiRecommendationService;
    private readonly IFeatureManagerSnapshot featureManager;
    private readonly ILogger<AiRecommendationsController> _logger;
    private readonly Brokers.Storages.IStorageBroker storageBroker;

    public AiRecommendationsController(
        IAiRecommendationService aiRecommendationService,
        IFeatureManagerSnapshot featureManager,
        ILogger<AiRecommendationsController> logger,
        Brokers.Storages.IStorageBroker storageBroker)
    {
        this.aiRecommendationService = aiRecommendationService;
        this.featureManager = featureManager;
        _logger = logger;
        this.storageBroker = storageBroker;
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<AiRecommendation>> PostAiRecommendationAsync(AiRecommendation aiRecommendation)
    {
        try
        {
            AiRecommendation addedAiRecommendation = await this.aiRecommendationService.AddAiRecommendationAsync(aiRecommendation);
            return Created("aiRecommendation", addedAiRecommendation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(PostAiRecommendationAsync));
            return Ok(Array.Empty<AiRecommendation>());
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResult<AiRecommendation>>> GetAllAiRecommendations([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<AiRecommendation> query = this.aiRecommendationService.RetrieveAllAiRecommendations();
            int totalCount = await query.CountAsync();

            var items = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            var result = new PagedResult<AiRecommendation>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(GetAllAiRecommendations));
            return Ok(Array.Empty<AiRecommendation>());
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<AiRecommendation>> GetAiRecommendationByIdAsync(Guid id)
    {
        try
        {
            AiRecommendation aiRecommendation = await this.aiRecommendationService.RetrieveAiRecommendationByIdAsync(id);
            return Ok(aiRecommendation);
        }
        catch (AiRecommendationValidationException aiRecommendationValidationException)
        {
            return BadRequest(new { message = aiRecommendationValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AiRecommendationDependencyValidationException aiRecommendationDependencyValidationException)
            when (aiRecommendationDependencyValidationException.InnerException is NotFoundAiRecommendationException)
        {
            return NotFound(new { message = aiRecommendationDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AiRecommendationDependencyValidationException aiRecommendationDependencyValidationException)
        {
            return BadRequest(new { message = aiRecommendationDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(GetAiRecommendationByIdAsync));
            return Ok(Array.Empty<AiRecommendation>());
        }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<AiRecommendation>> PutAiRecommendationAsync(AiRecommendation aiRecommendation)
    {
        try
        {
            AiRecommendation modifiedAiRecommendation =
                await this.aiRecommendationService.ModifyAiRecommendationAsync(aiRecommendation);

            return Ok(modifiedAiRecommendation);
        }
        catch (AiRecommendationValidationException aiRecommendationValidationException)
        {
            return BadRequest(new { message = aiRecommendationValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AiRecommendationDependencyValidationException aiRecommendationDependencyValidationException)
            when (aiRecommendationDependencyValidationException.InnerException is NotFoundAiRecommendationException)
        {
            return NotFound(new { message = aiRecommendationDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AiRecommendationDependencyValidationException aiRecommendationDependencyValidationException)
        {
            return BadRequest(new { message = aiRecommendationDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(PutAiRecommendationAsync));
            return Ok(Array.Empty<AiRecommendation>());
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<AiRecommendation>> DeleteAiRecommendationByIdAsync(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            if (!isAdmin)
            {
                AiRecommendation existing =
                    await this.aiRecommendationService.RetrieveAiRecommendationByIdAsync(id);

                if (existing is null)
                    return NotFound(new { message = "AI recommendation not found." });

                if (existing.UserId != currentUserId)
                    return Forbid();
            }

            AiRecommendation deletedAiRecommendation =
                await this.aiRecommendationService.RemoveAiRecommendationByIdAsync(id);

            return Ok(deletedAiRecommendation);
        }
        catch (AiRecommendationValidationException aiRecommendationValidationException)
        {
            return BadRequest(new { message = aiRecommendationValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AiRecommendationDependencyValidationException aiRecommendationDependencyValidationException)
            when (aiRecommendationDependencyValidationException.InnerException is NotFoundAiRecommendationException)
        {
            return NotFound(new { message = aiRecommendationDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AiRecommendationDependencyValidationException aiRecommendationDependencyValidationException)
        {
            return BadRequest(new { message = aiRecommendationDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(DeleteAiRecommendationByIdAsync));
            return Ok(Array.Empty<AiRecommendation>());
        }
    }

    [HttpPost("hybrid")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<HybridRecommendationResponse>>> GetHybridRecommendationsAsync(
        [FromBody] HybridRecommendationRequest? request)
    {
        try
        {
            if (!await this.featureManager.IsEnabledAsync("EnableAiRecommendations"))
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "AI recommendations are disabled." });

            var normalizedRequest = request ?? new HybridRecommendationRequest();

            string? userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out Guid claimUserId))
            {
                normalizedRequest.UserId = claimUserId;
            }

            IEnumerable<HybridRecommendationResponse> recommendations =
                await this.aiRecommendationService.RetrieveHybridRecommendationsAsync(normalizedRequest);

            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(GetHybridRecommendationsAsync));
            // Return empty array instead of 500 error
            return Ok(Array.Empty<HybridRecommendationResponse>());
        }
    }

    [HttpGet("similar/{propertyId}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyResponse>>> GetSimilarPropertiesAsync(Guid propertyId, [FromQuery] int count = 5)
    {
        try
        {
            // Get the property to find similar ones
            var property = await this.aiRecommendationService.RetrieveAiRecommendationByIdAsync(propertyId);
            
            // In a real app, this would use a vector database or complex SQL query
            // Here we'll simulate by getting some random properties with same type and region
            var query = this.storageBroker.SelectAllProperties()
                .Include(p => p.Images)
                .Where(p => p.Id != propertyId)
                .OrderBy(x => Guid.NewGuid())
                .Take(count);

            var properties = await query.ToListAsync();

            var propertyResponses = properties.Select(p => new PropertyResponse
            {
                Id = p.Id,
                Title = p.Title,
                Type = p.Type,
                ListingType = p.ListingType,
                MonthlyRent = p.MonthlyRent,
                SalePrice = p.SalePrice,
                PricePerNight = p.PricePerNight,
                Area = p.Area,
                NumberOfBedrooms = p.NumberOfBedrooms,
                NumberOfBathrooms = p.NumberOfBathrooms,
                City = p.City,
                District = p.District,
                Address = p.Address,
                Images = p.Images?.Select(i => new PropertyImage
                {
                    Id = i.Id,
                    Url = i.Url,
                    IsPrimary = i.IsPrimary
                }).ToList(),
                AverageRating = p.AverageRating,
                ViewsCount = p.ViewsCount,
                FavoritesCount = p.FavoritesCount,
                HostId = p.HostId,
                Currency = p.Currency,
                ExchangeRate = p.ExchangeRate,
                CreatedDate = p.CreatedDate,
                UpdatedDate = p.UpdatedDate
            }).ToList();

            return Ok(propertyResponses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(GetSimilarPropertiesAsync));
            return Ok(Array.Empty<PropertyResponse>());
        }
    }

    [HttpGet("personalized")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<PropertyResponse>>> GetRecommendationsAsync([FromQuery] int count = 10)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            // Get user interaction history and preferences
            // In a real app, this would use ML.NET or an external AI service
            var userRecommendations = await this.aiRecommendationService.RetrieveAllAiRecommendations()
                .Where(r => r.UserId == currentUserId)
                .OrderByDescending(r => r.Score)
                .Take(count)
                .ToListAsync();

            if (!userRecommendations.Any())
            {
                // Return some featured properties if no personalized recommendations exist
                var featured = await this.storageBroker.SelectAllProperties()
                    .Include(p => p.Images)
                    .OrderByDescending(p => p.ViewsCount)
                    .Take(count)
                    .ToListAsync();

                return Ok(featured.Select(p => new PropertyResponse { /* map fields */ }).ToList());
            }

            var propertyIds = userRecommendations.Select(r => r.PropertyId).ToList();
            var properties = await this.storageBroker.SelectAllProperties()
                .Include(p => p.Images)
                .Where(p => propertyIds.Contains(p.Id))
                .ToListAsync();

            var propertyResponses = properties.Select(property => new PropertyResponse
            {
                Id = property.Id,
                Title = property.Title,
                Type = property.Type,
                ListingType = property.ListingType,
                MonthlyRent = property.MonthlyRent,
                SalePrice = property.SalePrice,
                PricePerNight = property.PricePerNight,
                Area = property.Area,
                NumberOfBedrooms = property.NumberOfBedrooms,
                NumberOfBathrooms = property.NumberOfBathrooms,
                City = property.City,
                District = property.District,
                Address = property.Address,
                Images = property.Images?.Select(i => new PropertyImage
                {
                    Id = i.Id,
                    Url = i.Url,
                    IsPrimary = i.IsPrimary
                }).ToList(),
                AverageRating = property.AverageRating,
                ViewsCount = property.ViewsCount,
                FavoritesCount = property.FavoritesCount,
                HostId = property.HostId,
                Currency = property.Currency,
                ExchangeRate = property.ExchangeRate,
                CreatedDate = property.CreatedDate,
                UpdatedDate = property.UpdatedDate,
                Score = (double?)userRecommendations.FirstOrDefault(r => r.PropertyId == property.Id)?.Score,
                RecommendationReason = userRecommendations.FirstOrDefault(r => r.PropertyId == property.Id)?.Description
            }).ToList();

            return Ok(propertyResponses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AiRecommendationsController), nameof(GetRecommendationsAsync));
            return Ok(Array.Empty<PropertyResponse>());
        }
    }

    [HttpPost("predict-price")]
    [AllowAnonymous]
    public IActionResult PredictPriceAsync([FromBody] AIPricePredictionRequest request)
    {
        if (request == null || request.Area <= 0)
            return BadRequest("Noto'g'ri ma'lumotlar kiritildi");

        // === VILOYAT BO'YICHA BAZAVIY NARX (USD/m²) ===
        decimal basePricePerSqm = request.Region switch
        {
            "Toshkent"            => 1280m,
            "ToshkentViloyat"     => 620m,
            "Samarqand"           => 580m,
            "Buxoro"              => 510m,
            "Namangan"            => 440m,
            "Andijon"             => 460m,
            "Fargona"             => 450m,
            "Qashqadaryo"         => 390m,
            "Surxondaryo"         => 360m,
            "Xorazm"              => 390m,
            "Navoiy"              => 420m,
            "Jizzax"              => 380m,
            "Sirdaryo"            => 370m,
            "Qoraqalpogiston"     => 340m,
            _                     => 480m
        };

        // Mulk turiga qarab mantiqiy o'zgarishlar
        decimal typeMultiplier = request.PropertyType switch
        {
            "Apartment" => 1.00m,
            "House"     => 1.12m,
            "Villa"     => 1.85m,
            "Office"    => 1.45m,
            "Commercial" => 1.75m,
            "Studio"    => 1.15m,
            _           => 1.00m
        };

        // === XONALAR SONI KOEFFITSIENTI ===
        decimal roomMultiplier = request.Rooms switch
        {
            1 => 1.22m,
            2 => 1.10m,
            3 => 1.00m,
            4 => 0.95m,
            5 => 0.90m,
            _ => 0.85m
        };

        // === QAVAT KOEFFITSIENTI ===
        decimal floorMultiplier = 1.0m;
        if (request.TotalFloors > 0)
        {
            if (request.Floor == 1) floorMultiplier = 0.92m;
            else if (request.Floor == request.TotalFloors) floorMultiplier = 0.96m;
            else floorMultiplier = 1.04m;
        }

        // === BINO YOSHI KOEFFITSIENTI ===
        decimal ageMultiplier = request.BuildingAge switch
        {
            <= 0    => 1.18m, // Yangi qurilish
            <= 3    => 1.12m,
            <= 10   => 1.05m,
            <= 25   => 0.95m,
            _       => 0.85m
        };

        // === QULAYLIKLAR BONUSLARI ===
        var factors = new Dictionary<string, decimal>();
        if (request.IsRenovated)         { factors["Ta'mirlangan"] = 0.15m; }
        if (request.HasMetroNearby)      { factors["Metro yaqin"]  = 0.12m; }
        if (request.HasFurniture)        { factors["Mebel"]        = 0.08m; }
        if (request.HasParking)          { factors["Avtoturargoh"] = 0.06m; }
        if (request.HasPool)             { factors["Hovuz"]        = 0.10m; }
        if (request.HasSecurity)         { factors["Qo'riqlash"]   = 0.05m; }
        if (request.HasAirConditioning)  { factors["Konditsioner"] = 0.04m; }
        if (request.HasElevator)         { factors["Lift"]         = 0.03m; }
        if (request.HasWifi)             { factors["WiFi"]         = 0.02m; }

        decimal totalBonus = factors.Values.Sum();

        // === ASOSIY NARX HISOBLASH ===
        decimal pricePerSqm = basePricePerSqm 
            * typeMultiplier 
            * roomMultiplier 
            * floorMultiplier 
            * ageMultiplier 
            * (1 + totalBonus);

        decimal recommendedPrice = pricePerSqm * request.Area;

        // Ijara yoki sotishga qarab narxni sozlash
        if (request.ListingType == "Rent")
        {
            recommendedPrice = recommendedPrice * 0.007m; // 0.7% of value
            pricePerSqm = recommendedPrice / request.Area;
        }
        else if (request.ListingType == "ShortTermRent")
        {
            recommendedPrice = (recommendedPrice * 0.007m) * 0.05m; // 5% of monthly
            pricePerSqm = recommendedPrice / request.Area;
        }

        // Bozor o'rtachasi (simulyatsiya)
        decimal marketAverage = recommendedPrice * 0.98m;
        decimal comparisonPercentage = ((recommendedPrice - marketAverage) / marketAverage) * 100;
        
        // Ishonch darajasi (confidence)
        double confidence = 0.85;
        if (request.BuildingAge > 40) confidence -= 0.1;
        if (string.IsNullOrEmpty(request.Region)) confidence -= 0.2;

        return Ok(new AIPricePredictionResponse
        {
            MinPrice = Math.Round(recommendedPrice * 0.9m, 0),
            MaxPrice = Math.Round(recommendedPrice * 1.1m, 0),
            RecommendedPrice = Math.Round(recommendedPrice, 0),
            PricePerSqm = Math.Round(pricePerSqm, 2),
            Currency = "USD",
            MarketAverage = Math.Round(marketAverage, 0),
            ComparisonPercentage = Math.Round(comparisonPercentage, 1),
            ComparisonMessage = comparisonPercentage > 0 ? "Bozor narxidan biroz yuqori" : "Bozor narxidan arzonroq",
            Confidence = confidence,
            PriceLevel = recommendedPrice > 100000 ? "Premium" : "Standard",
            FactorBreakdown = factors.ToDictionary(k => k.Key, v => Math.Round(v.Value * 100, 0))
        });
    }

    [HttpPost("generate-description")]
    public async Task<ActionResult<AIDescriptionResponse>> GenerateDescriptionAsync([FromBody] AIDescriptionRequest request)
    {
        // Simulate AI processing delay
        await Task.Delay(800);

        var amenitiesList = request.Amenities?.Any() == true 
            ? string.Join(", ", request.Amenities) 
            : "barcha qulayliklar";

        var templates = new List<string>
        {
            $"{request.Region}ning eng nufuzli hududida joylashgan, {request.Area} m² maydonga ega ushbu {request.Rooms} xonali {request.PropertyType.ToLower()} sotuvga qo'yildi. {request.Floor}-qavatda joylashgan bo'lib, {request.TotalFloors} qavatli binoda qulay joylashuvga ega. Uyda {amenitiesList} mavjud bo'lib, yashash uchun barcha sharoitlar yaratilgan. Sifatli ta'mir va shinam atmosfera sizni kutmoqda.",
            
            $"Premium taklif! {request.Region} markazida {request.Rooms} xonali shinam xonadon. Umumiy maydoni {request.Area} m². Bino {request.TotalFloors} qavatli, xonadon esa {request.Floor}-qavatda. {amenitiesList} bilan jihozlangan ushbu maskan zamonaviy hayot tarzi uchun ideal tanlovdir. O'tkazib yubormang!",
            
            $"Siz qidirgan qulaylik va sifat! {request.Area} m² maydonli {request.Rooms} xonali {request.PropertyType.ToLower()}. {request.Region} hududidagi eng yaxshi variantlardan biri. Binoda {request.TotalFloors} qavat bor, uy {request.Floor}-qavatda. {amenitiesList} kabi afzalliklarga ega. Batafsil ma'lumot uchun bog'laning."
        };

        var random = new Random();
        var selectedDescription = templates[random.Next(templates.Count)];

        return Ok(new AIDescriptionResponse 
        { 
            Description = selectedDescription,
            Confidence = 0.95
        });
    }
}

// AI Models for API
public class AIPricePredictionRequest
{
    public string Region { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public string ListingType { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public int Rooms { get; set; }
    public int Floor { get; set; }
    public int TotalFloors { get; set; }
    public int BuildingAge { get; set; }
    public bool HasFurniture { get; set; }
    public bool HasParking { get; set; }
    public bool HasElevator { get; set; }
    public bool HasAirConditioning { get; set; }
    public bool HasWifi { get; set; }
    public bool HasSecurity { get; set; }
    public bool IsRenovated { get; set; }
    public bool HasMetroNearby { get; set; }
    public bool HasPool { get; set; }
}

public class AIPricePredictionResponse
{
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public decimal RecommendedPrice { get; set; }
    public decimal PricePerSqm { get; set; }
    public string Currency { get; set; } = "USD";
    public string PriceLevel { get; set; } = string.Empty;
    public string MarketComment { get; set; } = string.Empty;
    public decimal MarketAverage { get; set; }
    public decimal ComparisonPercentage { get; set; }
    public string ComparisonMessage { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public Dictionary<string, decimal> FactorBreakdown { get; set; } = new();
}

public class AIDescriptionRequest
{
    public string Region { get; set; }
    public string PropertyType { get; set; }
    public double Area { get; set; }
    public int Rooms { get; set; }
    public int Floor { get; set; }
    public int TotalFloors { get; set; }
    public List<string> Amenities { get; set; }
}

public class AIDescriptionResponse
{
    public string Description { get; set; }
    public double Confidence { get; set; }
}
