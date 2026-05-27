using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Properties.Exceptions;
using Mulkchi.Api.Services.Foundations.Properties;
using Microsoft.FeatureManagement;
using System.Threading.Tasks;
using System;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService propertyService;
    private readonly IFeatureManagerSnapshot featureManager;

    public PropertiesController(
        IPropertyService propertyService,
        IFeatureManagerSnapshot featureManager)
    {
        this.propertyService = propertyService;
        this.featureManager = featureManager;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<PropertyCreateResponse>> PostPropertyAsync([FromBody] PropertyCreateDto dto)
    {
        try
        {
            var response = await this.propertyService.AddPropertyWithUserUpgradeAsync(dto, User);
            return Created($"api/properties/{response.Property.Id}", response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (PropertyValidationException propertyValidationException)
        {
            return BadRequest(new { message = propertyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyValidationException propertyDependencyValidationException)
        {
            return BadRequest(new { message = propertyDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
        catch (PropertyServiceException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<PropertyResponse>>> GetAllProperties([FromQuery] PropertyQueryParams? queryParams)
    {
        try
        {
            queryParams ??= new PropertyQueryParams { Page = 1, PageSize = 20 };

            if (queryParams.Page < 1) queryParams.Page = 1;
            if (queryParams.PageSize < 1) queryParams.PageSize = 20;
            if (queryParams.PageSize > 100) queryParams.PageSize = 100;

            var (items, total) = await this.propertyService.RetrieveAllPropertiesAsync(queryParams);

            var result = new PagedResult<PropertyResponse>
            {
                Items = items,
                TotalCount = total,
                Page = queryParams.Page,
                PageSize = queryParams.PageSize
            };

            return Ok(result);
        }
        catch (PropertyDependencyException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
        catch (PropertyServiceException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<PropertyResponse>> GetPropertyByIdAsync(Guid id)
    {
        try
        {
            var property = await this.propertyService.RetrievePropertyByIdAsync(id);
            if (property is null)
                return NotFound(new { message = $"Property with id '{id}' was not found." });
            return Ok(property);
        }
        catch (PropertyDependencyValidationException propertyDependencyValidationException)
        {
            return NotFound(new { message = propertyDependencyValidationException.InnerException?.Message ?? "Not found." });
        }
        catch (PropertyDependencyException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
        catch (PropertyServiceException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("autocomplete")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<string>>> Autocomplete([FromQuery] string query)
    {
        try
        {
            var suggestions = await this.propertyService.SearchLocationSuggestionsAsync(query);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}/similar")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyResponse>>> GetSimilarProperties(Guid id, [FromQuery] int count = 6)
    {
        try
        {
            var similar = await this.propertyService.RetrieveSimilarPropertiesAsync(id, count);
            return Ok(similar);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("featured")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyResponse>>> GetFeaturedProperties([FromQuery] int count = 8)
    {
        try
        {
            var featured = await this.propertyService.RetrieveFeaturedPropertiesAsync(count);
            return Ok(featured);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<PropertyResponse>>> SearchProperties([FromQuery] PropertySearchParams searchParams)
    {
        try
        {
            if (!await this.featureManager.IsEnabledAsync("EnableSearch"))
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Search is temporarily disabled." });

            var (items, total) = await this.propertyService.SearchPropertiesAsync(searchParams);

            var result = new PagedResult<PropertyResponse>
            {
                Items = items,
                TotalCount = total,
                Page = 1,
                PageSize = 50
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Host,Admin,SuperAdmin")]
    public async ValueTask<ActionResult<Property>> PutPropertyAsync(Guid id, [FromBody] Property property)
    {
        try
        {
            property.Id = id;
            Property modifiedProperty = await this.propertyService.ModifyPropertyAsync(property);
            return Ok(modifiedProperty);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (PropertyValidationException propertyValidationException)
        {
            return BadRequest(new { message = propertyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyValidationException propertyDependencyValidationException)
        {
            return BadRequest(new { message = propertyDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
        catch (PropertyServiceException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Host,Admin,SuperAdmin")]
    public async ValueTask<ActionResult<Property>> DeletePropertyAsync(Guid id)
    {
        try
        {
            Property deletedProperty = await this.propertyService.RemovePropertyByIdAsync(id);
            return Ok(deletedProperty);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (PropertyValidationException propertyValidationException)
        {
            return BadRequest(new { message = propertyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyValidationException propertyDependencyValidationException)
        {
            return BadRequest(new { message = propertyDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
        catch (PropertyServiceException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpPatch("{id:guid}/verify")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async ValueTask<ActionResult<Property>> PatchPropertyVerifyAsync(Guid id)
    {
        try
        {
            Property verifiedProperty = await this.propertyService.VerifyPropertyAsync(id);
            return Ok(verifiedProperty);
        }
        catch (PropertyValidationException propertyValidationException)
        {
            return BadRequest(new { message = propertyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyValidationException propertyDependencyValidationException)
        {
            return BadRequest(new { message = propertyDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyDependencyException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
        catch (PropertyServiceException)
        {
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpPut("{id:guid}/publish")]
    [Authorize(Roles = "Host,Admin,SuperAdmin")]
    public async ValueTask<ActionResult<PropertyResponse>> PublishPropertyAsync(Guid id)
    {
        try
        {
            var response = await this.propertyService.PublishPropertyAsync(id);
            return Ok(new { message = "Property published successfully.", isPublished = true, property = response });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}/unpublish")]
    [Authorize(Roles = "Host,Admin,SuperAdmin")]
    public async ValueTask<ActionResult<PropertyResponse>> UnpublishPropertyAsync(Guid id)
    {
        try
        {
            var response = await this.propertyService.UnpublishPropertyAsync(id);
            return Ok(new { message = "Property unpublished successfully.", isPublished = false, property = response });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("my/listings")]
    [Authorize(Roles = "Host,Admin,SuperAdmin")]
    public async Task<ActionResult<PagedResult<PropertyResponse>>> GetMyListings([FromQuery] PropertyQueryParams queryParams)
    {
        try
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "Guest")
            {
                return Forbid();
            }

            var (items, total) = await this.propertyService.RetrieveMyPropertiesAsync(queryParams);

            var result = new PagedResult<PropertyResponse>
            {
                Items = items,
                TotalCount = total,
                Page = queryParams.Page,
                PageSize = queryParams.PageSize
            };

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("new-listings")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyResponse>>> GetNewListings([FromQuery] int days = 7, [FromQuery] int count = 10)
    {
        try
        {
            var properties = await this.propertyService.RetrieveNewListingsAsync(days, count);
            return Ok(properties);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/bump")]
    [Authorize(Roles = "Host,Admin,SuperAdmin")]
    public async Task<ActionResult<object>> BumpPropertyAsync(Guid id)
    {
        try
        {
            var property = await this.propertyService.RetrievePropertyByIdAsync(id);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (property is null || string.IsNullOrEmpty(userIdClaim) || property.HostId.ToString() != userIdClaim)
            {
                return Unauthorized(new { message = "You can only bump your own properties." });
            }

            property.BumpedAt = DateTimeOffset.UtcNow;
            await this.propertyService.ModifyPropertyAsync(property);

            return Ok(new
            {
                message = "Property bumped successfully. It will now appear higher in search results for 24 hours.",
                propertyId = id,
                bumpedAt = property.BumpedAt
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("filters/options")]
    [AllowAnonymous]
    public ActionResult<object> GetFilterOptions()
    {
        try
        {
            var options = new
            {
                PropertyTypes = Enum.GetNames(typeof(PropertyType)),
                PropertyCategories = Enum.GetNames(typeof(PropertyCategory)),
                ListingTypes = Enum.GetNames(typeof(ListingType)),
                Regions = Enum.GetNames(typeof(UzbekistanRegion)),
                Amenities = new[] { "WiFi", "Parking", "Pool", "AC", "Elevator", "Furniture", "Security" },
                PriceRanges = new[]
                {
                    new { label = "Under $500", min = 0, max = (int?)500 },
                    new { label = "$500 - $1000", min = 500, max = (int?)1000 },
                    new { label = "$1000 - $2000", min = 1000, max = (int?)2000 },
                    new { label = "$2000+", min = 2000, max = (int?)null }
                },
                BedroomOptions = new[] { 1, 2, 3, 4, 5 }
            };
            return Ok(options);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
