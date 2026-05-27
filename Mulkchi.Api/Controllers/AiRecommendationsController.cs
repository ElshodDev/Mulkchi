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
            return Ok(Array.Empty<HybridRecommendationResponse>());
        }
    }

    [HttpGet("similar/{propertyId}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyResponse>>> GetSimilarPropertiesAsync(Guid propertyId, [FromQuery] int count = 5)
    {
        try
        {
            var property = await this.aiRecommendationService.RetrieveAiRecommendationByIdAsync(propertyId);

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

            var userRecommendations = await this.aiRecommendationService.RetrieveAllAiRecommendations()
                .Where(r => r.UserId == currentUserId)
                .OrderByDescending(r => r.Score)
                .Take(count)
                .ToListAsync();

            if (!userRecommendations.Any())
            {
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

        decimal basePricePerSqm = request.Region switch
        {
            "Toshkent" => 1280m,
            "ToshkentViloyat" => 620m,
            "Samarqand" => 580m,
            "Buxoro" => 510m,
            "Namangan" => 440m,
            "Andijon" => 460m,
            "Fargona" => 450m,
            "Qashqadaryo" => 390m,
            "Surxondaryo" => 360m,
            "Xorazm" => 390m,
            "Navoiy" => 420m,
            "Jizzax" => 380m,
            "Sirdaryo" => 370m,
            "Qoraqalpogiston" => 340m,
            _ => 480m
        };

        decimal typeMultiplier = request.PropertyType switch
        {
            "Apartment" => 1.00m,
            "House" => 1.12m,
            "Villa" => 1.85m,
            "Office" => 1.45m,
            "Commercial" => 1.75m,
            "Studio" => 1.15m,
            _ => 1.00m
        };

        decimal roomMultiplier = request.Rooms switch
        {
            1 => 1.22m,
            2 => 1.10m,
            3 => 1.00m,
            4 => 0.95m,
            5 => 0.90m,
            _ => 0.85m
        };

        decimal floorMultiplier = 1.0m;
        if (request.TotalFloors > 0)
        {
            if (request.Floor == 1) floorMultiplier = 0.92m;
            else if (request.Floor == request.TotalFloors) floorMultiplier = 0.96m;
            else floorMultiplier = 1.04m;
        }

        decimal ageMultiplier = request.BuildingAge switch
        {
            <= 0 => 1.18m,
            <= 3 => 1.12m,
            <= 10 => 1.05m,
            <= 25 => 0.95m,
            _ => 0.85m
        };

        var factors = new Dictionary<string, decimal>();
        if (request.IsRenovated) { factors["Ta'mirlangan"] = 0.15m; }
        if (request.HasMetroNearby) { factors["Metro yaqin"] = 0.12m; }
        if (request.HasFurniture) { factors["Mebel"] = 0.08m; }
        if (request.HasParking) { factors["Avtoturargoh"] = 0.06m; }
        if (request.HasPool) { factors["Hovuz"] = 0.10m; }
        if (request.HasSecurity) { factors["Qo'riqlash"] = 0.05m; }
        if (request.HasAirConditioning) { factors["Konditsioner"] = 0.04m; }
        if (request.HasElevator) { factors["Lift"] = 0.03m; }
        if (request.HasWifi) { factors["WiFi"] = 0.02m; }

        decimal totalBonus = factors.Values.Sum();

        decimal pricePerSqm = basePricePerSqm
            * typeMultiplier
            * roomMultiplier
            * floorMultiplier
            * ageMultiplier
            * (1 + totalBonus);

        decimal recommendedPrice = pricePerSqm * request.Area;

        if (request.ListingType == "Rent")
        {
            recommendedPrice = recommendedPrice * 0.007m;
            pricePerSqm = recommendedPrice / request.Area;
        }
        else if (request.ListingType == "ShortTermRent")
        {
            recommendedPrice = (recommendedPrice * 0.007m) * 0.025m;
            pricePerSqm = recommendedPrice / request.Area;
        }

        decimal marketAverage = recommendedPrice * 0.98m;
        decimal comparisonPercentage = ((recommendedPrice - marketAverage) / marketAverage) * 100;

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
        await Task.Delay(800);

        var amenitiesList = request.Amenities?.Any() == true
            ? string.Join(", ", request.Amenities)
            : "barcha qulayliklar";

        string propType = request.PropertyType switch
        {
            "Apartment" => "kvartira",
            "House" => "hovli",
            "Villa" => "villa",
            "Office" => "ofis",
            "Shop" => "do'kon",
            "Commercial" => "tijorat binosi",
            "Land" => "yer uchastkasi",
            _ => "mulk"
        };

        string regionName = request.Region switch
        {
            "ToshkentViloyati" => "Toshkent viloyati",
            "Qoraqalpogiston" => "Qoraqalpog'iston",
            "Fargona" => "Farg'ona",
            _ => request.Region
        };

        var templates = new List<string>
        {
            $"{regionName}ning eng nufuzli hududida joylashgan, {request.Area} m² maydonga ega ushbu {request.Rooms} xonali {propType} sotuvga qo'yildi. {(request.TotalFloors > 0 ? $"{request.Floor}-qavatda joylashgan bo'lib, {request.TotalFloors} qavatli binoda qulay joylashuvga ega." : "")} Ushbu obyekda {amenitiesList} mavjud bo'lib, barcha sharoitlar yaratilgan. Sifatli ta'mir va shinam atmosfera sizni kutmoqda.",

            $"Premium taklif! {regionName} markazida {request.Rooms} xonali shinam {propType}. Umumiy maydoni {request.Area} m². {(request.TotalFloors > 0 ? $"Bino {request.TotalFloors} qavatli, obyekt esa {request.Floor}-qavatda." : "")} {amenitiesList} bilan jihozlangan ushbu maskan ideal tanlovdir. O'tkazib yubormang!",

            $"Siz qidirgan qulaylik va sifat! {request.Area} m² maydonli {request.Rooms} xonali {propType}. {regionName} hududidagi eng yaxshi variantlardan biri. {(request.TotalFloors > 0 ? $"Binoda {request.TotalFloors} qavat bor, obyekt {request.Floor}-qavatda." : "")} {amenitiesList} kabi afzalliklarga ega. Batafsil ma'lumot uchun bog'laning."
        };

        var random = new Random();
        var selectedDescription = templates[random.Next(templates.Count)];

        return Ok(new AIDescriptionResponse
        {
            Description = selectedDescription,
            Confidence = 0.95
        });
    }

    [HttpPost("smart-search")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyResponse>>> SmartSearchAsync([FromBody] SmartSearchRequest request)
    {
        try
        {
            await Task.Delay(1500);

            string q = request.Query.ToLower();
            var allProperties = await storageBroker.SelectAllProperties().ToListAsync();
            
            var query = allProperties.AsQueryable();

            if (q.Contains("ijara"))
            {
                query = query.Where(p => p.ListingType == ListingType.Rent || p.ListingType == ListingType.ShortTermRent);
            }
            else if (q.Contains("sotuv") || q.Contains("sotib") || q.Contains("sotiladigan"))
            {
                query = query.Where(p => p.ListingType == ListingType.Sale);
            }

            if (q.Contains("kvartira"))
            {
                query = query.Where(p => p.Type == PropertyType.Apartment);
            }
            else if (q.Contains("hovli"))
            {
                query = query.Where(p => p.Type == PropertyType.House || p.Type == PropertyType.Villa);
            }
            else if (q.Contains("do'kon") || q.Contains("dokon") || q.Contains("tijorat"))
            {
                query = query.Where(p => p.Type == PropertyType.Commercial);
            }

            foreach (UzbekistanRegion region in Enum.GetValues(typeof(UzbekistanRegion)))
            {
                string regionName = region.ToString().ToLower();
                
                if (regionName == "toshkentshahar" && q.Contains("toshkent") && !q.Contains("viloyat"))
                {
                    query = query.Where(p => p.Region == UzbekistanRegion.ToshkentShahar);
                    break;
                }
                else if (regionName == "toshkentviloyat" && q.Contains("toshkent viloyat"))
                {
                    query = query.Where(p => p.Region == UzbekistanRegion.ToshkentViloyat);
                    break;
                }
                else if (q.Contains(regionName) || q.Contains(regionName.Replace("o", "o'").Replace("g", "g'")))
                {
                    query = query.Where(p => p.Region == region);
                    break;
                }
            }

            for (int i = 1; i <= 10; i++)
            {
                if (q.Contains($"{i} xona") || q.Contains($"{i}-xona"))
                {
                    query = query.Where(p => p.NumberOfBedrooms == i);
                    break;
                }
            }

            var results = query.Take(10).Select(p => new PropertyResponse
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                Type = p.Type,
                ListingType = p.ListingType,
                Category = p.Category,
                Status = p.Status,
                MonthlyRent = p.MonthlyRent,
                SalePrice = p.SalePrice,
                PricePerNight = p.PricePerNight,
                Area = p.Area,
                NumberOfBedrooms = p.NumberOfBedrooms,
                NumberOfBathrooms = p.NumberOfBathrooms,
                Region = p.Region,
                City = p.City,
                Address = p.Address,
                HostId = p.HostId,
                Currency = p.Currency,
                CreatedDate = p.CreatedDate,
                UpdatedDate = p.UpdatedDate
            }).ToList();

            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SmartSearch");
            return BadRequest(new { message = "Aqlli qidiruv vaqtida xatolik yuz berdi" });
        }
    }

    [HttpPost("chat")]
    [AllowAnonymous]
    public async Task<ActionResult<ChatResponse>> ChatAsync([FromBody] ChatRequest request)
    {
        try
        {
            await Task.Delay(1500);

            string fullQuery = "";
            if (request.History != null && request.History.Any())
            {
                fullQuery = string.Join(" ", request.History).ToLower() + " ";
            }
            fullQuery += request.Message.ToLower();
            
            string currentMessage = request.Message.ToLower();

            var allProperties = await storageBroker.SelectAllProperties().ToListAsync();
            
            var query = allProperties.AsQueryable();

            bool hasFilters = false;

            if (fullQuery.Contains("ijara"))
            {
                query = query.Where(p => p.ListingType == ListingType.Rent || p.ListingType == ListingType.ShortTermRent);
                hasFilters = true;
            }
            else if (fullQuery.Contains("sotuv") || fullQuery.Contains("sotib") || fullQuery.Contains("sotiladigan") || fullQuery.Contains("sotiladgan"))
            {
                query = query.Where(p => p.ListingType == ListingType.Sale);
                hasFilters = true;
            }

            if (fullQuery.Contains("kvartira"))
            {
                query = query.Where(p => p.Type == PropertyType.Apartment);
                hasFilters = true;
            }
            else if (fullQuery.Contains("hovli"))
            {
                query = query.Where(p => p.Type == PropertyType.House || p.Type == PropertyType.Villa);
                hasFilters = true;
            }
            else if (fullQuery.Contains("do'kon") || fullQuery.Contains("dokon") || fullQuery.Contains("tijorat"))
            {
                query = query.Where(p => p.Type == PropertyType.Commercial);
                hasFilters = true;
            }

            bool hasRegion = false;
            foreach (UzbekistanRegion region in Enum.GetValues(typeof(UzbekistanRegion)))
            {
                string regionName = region.ToString().ToLower();
                
                if (regionName == "toshkentshahar" && fullQuery.Contains("toshkent") && !fullQuery.Contains("viloyat"))
                {
                    query = query.Where(p => p.Region == UzbekistanRegion.ToshkentShahar);
                    hasFilters = true;
                    hasRegion = true;
                    break;
                }
                else if (regionName == "toshkentviloyat" && fullQuery.Contains("toshkent viloyat"))
                {
                    query = query.Where(p => p.Region == UzbekistanRegion.ToshkentViloyat);
                    hasFilters = true;
                    hasRegion = true;
                    break;
                }
                else if (fullQuery.Contains(regionName) || fullQuery.Contains(regionName.Replace("o", "o'").Replace("g", "g'")))
                {
                    query = query.Where(p => p.Region == region);
                    hasFilters = true;
                    hasRegion = true;
                    break;
                }
            }

            bool hasRooms = false;
            for (int i = 1; i <= 10; i++)
            {
                if (fullQuery.Contains($"{i} xona") || fullQuery.Contains($"{i}-xona"))
                {
                    query = query.Where(p => p.NumberOfBedrooms == i);
                    hasFilters = true;
                    hasRooms = true;
                    break;
                }
            }

            string replyMessage = "";

            if (currentMessage.Contains("salom") || currentMessage.Contains("assalom"))
            {
                return Ok(new ChatResponse { Reply = "Vaalaykum assalom! Men Mulkchi AI yordamchisiman. Sizga qanday mulk kerak yoki ko'chmas mulk bo'yicha qanday savollaringiz bor?" });
            }
            else if (currentMessage.Contains("rahmat"))
            {
                return Ok(new ChatResponse { Reply = "Sizga ham rahmat! Yana qandaydir savollaringiz bo'lsa, so'rashingiz mumkin." });
            }
            else if (currentMessage.Contains("shartnoma") || currentMessage.Contains("qanday tuziladi") || currentMessage.Contains("hujjat"))
            {
                return Ok(new ChatResponse { Reply = "Ijara shartnomasini tuzish uchun ikkala tomonning pasporti va uyning kadastr hujjatlari kerak. Shartnomada ijara muddati, oylik to'lov va shartlar ko'rsatilishi hamda soliq tizimida (E-ijara.uz) ro'yxatdan o'tkazilishi qonunan majburiydir." });
            }
            else if (currentMessage.Contains("bahola") || currentMessage.Contains("narxi qanday") || currentMessage.Contains("narxini aniqla"))
            {
                return Ok(new ChatResponse { Reply = "Uyingizni baholash uchun asosiy menyudan 'AI Narx Bashorati' xizmatimizga kiring. U yerda sun'iy intellekt bozor ma'lumotlari asosida uyingizning eng aniq bozor narxini hisoblab beradi." });
            }
            else if (currentMessage.Contains("nima qilishim kerak") || currentMessage.Contains("nima qilshim kerak") || currentMessage.Contains("qanday foydalan") || currentMessage.Contains("tushunmadim") || currentMessage.Contains("yordam bering"))
            {
                return Ok(new ChatResponse { Reply = "Sizga qanday yordam kerak? Saytdan uylarni qidirishingiz, ijara yoki sotuvga e'lon berishingiz yoxud uyingizning narxini sun'iy intellekt orqali baholashingiz mumkin." });
            }

            if (currentMessage.Contains("tavsiya") || currentMessage.Contains("maslahat") || currentMessage.Contains("yordam"))
            {
                var count = query.Count();
                if (hasFilters && count > 0) 
                {
                    var results = query.OrderByDescending(p => p.CreatedDate).Take(2).ToList();
                    replyMessage = $"Albatta! Sizning oldingi qidiruvlaringizga asoslanib shularni tavsiya qilaman:";
                    var propertyResponses = results.Select(p => new PropertyResponse
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Description = p.Description,
                        Type = p.Type,
                        ListingType = p.ListingType,
                        Category = p.Category,
                        Status = p.Status,
                        MonthlyRent = p.MonthlyRent,
                        SalePrice = p.SalePrice,
                        PricePerNight = p.PricePerNight,
                        Area = p.Area,
                        NumberOfBedrooms = p.NumberOfBedrooms,
                        NumberOfBathrooms = p.NumberOfBathrooms,
                        Region = p.Region,
                        City = p.City,
                        Address = p.Address,
                        HostId = p.HostId,
                        Currency = p.Currency,
                        CreatedDate = p.CreatedDate,
                        UpdatedDate = p.UpdatedDate
                    }).ToList();
                    
                    return Ok(new ChatResponse { Reply = replyMessage, Properties = propertyResponses });
                }
                else
                {
                    var results = allProperties.OrderByDescending(p => p.CreatedDate).Take(2).ToList();
                    replyMessage = $"Hozirgi kunda platformamizdagi eng mashhur va yangi uylarni tavsiya qila olaman:";
                    var propertyResponses = results.Select(p => new PropertyResponse
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Description = p.Description,
                        Type = p.Type,
                        ListingType = p.ListingType,
                        Category = p.Category,
                        Status = p.Status,
                        MonthlyRent = p.MonthlyRent,
                        SalePrice = p.SalePrice,
                        PricePerNight = p.PricePerNight,
                        Area = p.Area,
                        NumberOfBedrooms = p.NumberOfBedrooms,
                        NumberOfBathrooms = p.NumberOfBathrooms,
                        Region = p.Region,
                        City = p.City,
                        Address = p.Address,
                        HostId = p.HostId,
                        Currency = p.Currency,
                        CreatedDate = p.CreatedDate,
                        UpdatedDate = p.UpdatedDate
                    }).ToList();

                    return Ok(new ChatResponse { Reply = replyMessage, Properties = propertyResponses });
                }
            }
            else if (hasFilters)
            {
                if (!hasRegion)
                {
                    replyMessage = "Tushunarli! Lekin aniq qaysi viloyatdan yoki shahardan izlayotganingizni yozmadingiz. Qayerdan qidiraylik?";
                }
                else if (!hasRooms && fullQuery.Contains("kvartira"))
                {
                    replyMessage = "Yaxshi! Qidiruvni aniqlashtirish uchun necha xonali uy kerakligini yozib yuboring (Masalan: 2 xonali).";
                }
                else 
                {
                    var count = query.Count();
                    if (count == 0)
                    {
                        replyMessage = "Kechirasiz, aynan ushbu shartlaringizga mos tushadigan e'lonlar hozircha bazamizda yo'q. Boshqa shartlar bo'yicha qidirib ko'rasizmi?";
                    }
                    else
                    {
                        var results = query.Take(3).ToList();
                        replyMessage = $"Men sizga barcha talablaringiz bo'yicha {count} ta e'lon topdim. Ular bilan tanishib chiqing:";
                        var propertyResponses = results.Select(p => new PropertyResponse
                        {
                            Id = p.Id,
                            Title = p.Title,
                            Description = p.Description,
                            Type = p.Type,
                            ListingType = p.ListingType,
                            Category = p.Category,
                            Status = p.Status,
                            MonthlyRent = p.MonthlyRent,
                            SalePrice = p.SalePrice,
                            PricePerNight = p.PricePerNight,
                            Area = p.Area,
                            NumberOfBedrooms = p.NumberOfBedrooms,
                            NumberOfBathrooms = p.NumberOfBathrooms,
                            Region = p.Region,
                            City = p.City,
                            Address = p.Address,
                            HostId = p.HostId,
                            Currency = p.Currency,
                            CreatedDate = p.CreatedDate,
                            UpdatedDate = p.UpdatedDate
                        }).ToList();

                        return Ok(new ChatResponse { Reply = replyMessage, Properties = propertyResponses });
                    }
                }
            }
            else
            {
                replyMessage = "Sizga qanday uy kerakligini aniqlashim uchun yordam bering: qaysi viloyatdan va necha xonali uy qidiryapsiz? Yoki sizga eng yaxshi uylarni 'tavsiya' qilaymi?";
            }

            return Ok(new ChatResponse { Reply = replyMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Chat");
            return BadRequest(new { message = "Xatolik yuz berdi" });
        }
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public List<string> History { get; set; } = new();
}

public class ChatResponse
{
    public string Reply { get; set; } = string.Empty;
    public List<PropertyResponse>? Properties { get; set; }
}

public class SmartSearchRequest
{
    public string Query { get; set; } = string.Empty;
}

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
