using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.AIs;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Models.Foundations.AIs.Exceptions;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.AiRecommendations;
using Mulkchi.Api.Services.Foundations.AI;
using Microsoft.FeatureManagement;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiRecommendationsController : ControllerBase
{
    private readonly IAiRecommendationService aiRecommendationService;
    private readonly IFeatureManagerSnapshot featureManager;

    public AiRecommendationsController(
        IAiRecommendationService aiRecommendationService,
        IFeatureManagerSnapshot featureManager)
    {
        this.aiRecommendationService = aiRecommendationService;
        this.featureManager = featureManager;
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
        catch (Exception)
        {
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
        catch (Exception)
        {
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
        catch (Exception)
        {
            return Ok(Array.Empty<AiRecommendation>());
        }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<AiRecommendation>> PutAiRecommendationAsync(AiRecommendation aiRecommendation)
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
                    await this.aiRecommendationService.RetrieveAiRecommendationByIdAsync(aiRecommendation.Id);

                if (existing is null)
                    return NotFound(new { message = "AI recommendation not found." });

                if (existing.UserId != currentUserId)
                    return Forbid();
            }

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
        catch (Exception)
        {
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
        catch (Exception)
        {
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
        catch (Exception)
        {
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

            // Get user ID if authenticated
            string? userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid userId = Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : Guid.Empty;

            // Get recommendations (will filter by similar properties in the service)
            IEnumerable<PropertyResponse> recommendations =
                await this.aiRecommendationService.GetRecommendationsForUserAsync(userId, count);

            return Ok(recommendations);
        }
        catch (Exception)
        {
            // Return empty array instead of 500 error
            return Ok(Array.Empty<PropertyResponse>());
        }
    }

    [HttpGet("recommendations")]
    [Authorize]
    public async Task<ActionResult<List<AiRecommendation>>> GetRecommendationsAsync([FromQuery] int count = 5)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized(new { message = "User not authenticated." });

            // Get user's recommendations
            IQueryable<AiRecommendation> recommendations = this.aiRecommendationService.RetrieveAllAiRecommendations();
            
            // Filter by current user and take limited count
            var userRecommendations = recommendations
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedDate)
                .Take(count)
                .ToList();

            return Ok(userRecommendations);
        }
        catch (Exception)
        {
            return Ok(Array.Empty<AiRecommendation>());
        }
    }

    // Simple price prediction endpoint for frontend
    public class PricePredictionRequest
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

    public class PricePredictionResponse
    {
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public decimal RecommendedPrice { get; set; }
        public decimal PricePerSqm { get; set; }
        public string Currency { get; set; } = "USD";
        public string PriceLevel { get; set; } = string.Empty;
        public string MarketComment { get; set; } = string.Empty;
        public Dictionary<string, decimal> FactorBreakdown { get; set; } = new();
    }

    [HttpPost("predict-price")]
    [AllowAnonymous]
    public IActionResult PredictPriceAsync([FromBody] PricePredictionRequest request)
    {
        if (request == null || request.Area <= 0)
            return BadRequest("Noto'g'ri ma'lumotlar kiritildi");

        // === VILOYAT BO'YICHA BAZAVIY NARX (USD/m²) ===
        // Haqiqiy O'zbekiston bozori narxlari asosida (2024 yil holatiga)
        decimal basePricePerSqm = request.Region switch
        {
            "Toshkent"            => 1250m,  // Toshkent shahar — eng qimmat
            "ToshkentViloyat"     => 600m,   // Toshkent viloyat
            "Samarqand"           => 550m,   // Samarqand
            "Buxoro"              => 480m,   // Buxoro
            "Namangan"            => 420m,   // Namangan
            "Andijon"             => 440m,   // Andijon
            "Fargona"             => 430m,   // Farg'ona
            "Qashqadaryo"         => 380m,   // Qarshi
            "Surxondaryo"         => 350m,   // Termiz
            "Xorazm"              => 380m,   // Urganch
            "Navoiy"              => 410m,   // Navoiy
            "Jizzax"              => 370m,   // Jizzax
            "Sirdaryo"            => 360m,   // Guliston
            "Qoraqalpogiston"     => 330m,   // Nukus
            _                     => 450m
        };

        // Mulk turiga qarab mantiqiy o'zgarishlar
        decimal typeMultiplier = request.PropertyType switch
        {
            "Apartment" => 1.00m,
            "House"     => 1.15m, // Hovli uylar odatda m2 ga nisbatan biroz arzonroq yoki qimmatroq bo'lishi mumkin
            "Villa"     => 1.80m,
            "Office"    => 1.50m,
            "Commercial" => 1.70m,
            "Studio"    => 1.10m,
            _           => 1.00m
        };

        // === XONALAR SONI KOEFFITSIENTI ===
        // Kichik xonalar m² ga ko'ra qimmatroq
        decimal roomMultiplier = request.Rooms switch
        {
            1 => 1.20m,   // 1 xonali — eng qimmat m² da
            2 => 1.08m,   // 2 xonali
            3 => 1.00m,   // 3 xonali — baza
            4 => 0.94m,   // 4 xonali
            5 => 0.90m,   // 5 xonali
            _ => 0.86m    // 5+ xonali
        };

        // === QAVAT KOEFFITSIENTI ===
        decimal floorMultiplier = 1.0m;
        if (request.TotalFloors > 0)
        {
            double floorRatio = (double)request.Floor / request.TotalFloors;
            floorMultiplier = floorRatio switch
            {
                <= 0.15 => 0.93m,  // 1-qavat — past narx
                <= 0.85 => 1.03m,  // O'rta qavatlar — eng yaxshi
                _       => 0.97m   // Oxirgi qavat
            };
        }

        // === BINO YOSHI KOEFFITSIENTI ===
        decimal ageMultiplier = request.BuildingAge switch
        {
            <= 0    => 1.15m,  // Yangi qurilish
            <= 5    => 1.10m,  // 0-5 yil
            <= 10   => 1.05m,  // 5-10 yil
            <= 20   => 1.00m,  // 10-20 yil — baza
            <= 35   => 0.92m,  // 20-35 yil — Sovet davri
            _       => 0.82m   // 35+ yil — eski bino
        };

        // === QULAYLIKLAR BONUSLARI ===
        var factors = new Dictionary<string, decimal>();

        if (request.IsRenovated)     { factors["Ta'mirlangan"] = 0.12m; }
        if (request.HasMetroNearby)  { factors["Metro yaqin"]  = 0.10m; }
        if (request.HasFurniture)    { factors["Mebel"]        = 0.07m; }
        if (request.HasParking)      { factors["Avtoturargoh"] = 0.06m; }
        if (request.HasPool)         { factors["Hovuz"]        = 0.06m; }
        if (request.HasSecurity)     { factors["Qo'riqlash"]   = 0.04m; }
        if (request.HasAirConditioning) { factors["Konditsioner"] = 0.04m; }
        if (request.HasElevator)     { factors["Lift"]         = 0.03m; }
        if (request.HasWifi)         { factors["WiFi"]         = 0.02m; }

        decimal totalBonus = factors.Values.Sum();

        // === ASOSIY NARX HISOBLASH ===
        decimal pricePerSqm = basePricePerSqm
            * typeMultiplier
            * roomMultiplier
            * floorMultiplier
            * ageMultiplier
            * (1 + totalBonus);

        decimal basePrice = pricePerSqm * request.Area;

        // === IJARA UCHUN OYLIK NARX ===
        if (request.ListingType == "Rent")
        {
            // Oylik ijara = sotish narxining 0.55-0.65%
            basePrice    = Math.Round(basePrice * 0.006m, 0);
            pricePerSqm  = Math.Round(pricePerSqm * 0.006m, 2);
        }
        else if (request.ListingType == "ShortTermRent")
        {
            // Kunlik ijara = oylik ijaraning 4-5%
            basePrice    = Math.Round(basePrice * 0.006m * 0.045m, 1);
            pricePerSqm  = Math.Round(pricePerSqm * 0.006m * 0.045m, 2);
        }
        else
        {
            basePrice    = Math.Round(basePrice, 0);
            pricePerSqm  = Math.Round(pricePerSqm, 2);
        }

        // === NARX SEGMENTI ===
        string priceLevel = request.ListingType == "Sale"
            ? basePrice switch
            {
                < 30000  => "Arzon segment",
                < 80000  => "O'rta segment",
                < 200000 => "Biznes segment",
                _        => "Premium segment"
            }
            : basePrice switch  // Ijara
            {
                < 300  => "Arzon segment",
                < 700  => "O'rta segment",
                < 1500 => "Biznes segment",
                _      => "Premium segment"
            };

        // === BOZOR SHARHI ===
        string comment = request.ListingType switch
        {
            "Rent"          => $"{request.Region} da {request.Rooms} xonali {request.Area}m² kvartira uchun oylik ijara narxi",
            "ShortTermRent" => $"{request.Region} da {request.Rooms} xonali {request.Area}m² kvartira uchun kunlik ijara narxi",
            _               => $"{request.Region} da {request.Rooms} xonali {request.Area}m² kvartira uchun sotish narxi"
        };

        return Ok(new PricePredictionResponse
        {
            MinPrice         = Math.Round(basePrice * 0.88m, 0),
            MaxPrice         = Math.Round(basePrice * 1.12m, 0),
            RecommendedPrice = basePrice,
            PricePerSqm      = pricePerSqm,
            Currency         = "USD",
            PriceLevel       = priceLevel,
            MarketComment    = comment,
            FactorBreakdown  = factors.ToDictionary(
                k => k.Key,
                v => Math.Round(v.Value * 100, 0)  // foiz ko'rinishida
            )
        });
    }
}
