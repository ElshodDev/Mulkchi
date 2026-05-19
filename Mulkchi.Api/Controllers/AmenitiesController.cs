using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Amenities;
using Mulkchi.Api.Services.Foundations.Amenities;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AmenitiesController : ControllerBase
{
    private readonly IAmenityService amenityService;

    public AmenitiesController(IAmenityService amenityService)
    {
        this.amenityService = amenityService;
    }

    [HttpGet]
    [AllowAnonymous]
    public ActionResult<IEnumerable<AmenityResponse>> GetAllAmenities()
    {
        try
        {
            var amenities = this.amenityService.RetrieveAllAmenities();
            return Ok(amenities);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<AmenityCategoryDto>> GetAmenitiesByCategory()
    {
        try
        {
            var categories = this.amenityService.RetrieveAmenitiesByCategory();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult<AmenityResponse>> CreateAmenityAsync([FromBody] AmenityCreateDto dto)
    {
        try
        {
            var amenity = await this.amenityService.AddAmenityAsync(dto);
            return Ok(amenity);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult<AmenityResponse>> UpdateAmenityAsync(Guid id, [FromBody] AmenityCreateDto dto)
    {
        try
        {
            var amenity = await this.amenityService.ModifyAmenityAsync(id, dto);
            return Ok(amenity);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult> DeleteAmenityAsync(Guid id)
    {
        try
        {
            var result = await this.amenityService.RemoveAmenityAsync(id);
            if (!result)
                return NotFound(new { message = "Amenity not found." });

            return Ok(new { message = "Amenity deleted successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("seed")]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult> SeedAmenitiesAsync()
    {
        try
        {
            await this.amenityService.SeedDefaultAmenitiesAsync();
            return Ok(new { message = "Amenities seeded successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // Property Amenities endpoints
    [HttpGet("properties/{propertyId:guid}")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<IEnumerable<AmenityResponse>>> GetPropertyAmenitiesAsync(Guid propertyId)
    {
        try
        {
            var amenities = await this.amenityService.RetrievePropertyAmenitiesAsync(propertyId);
            return Ok(amenities);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("properties/{propertyId:guid}")]
    [Authorize(Roles = "Host,Admin")]
    public async ValueTask<ActionResult> UpdatePropertyAmenitiesAsync(Guid propertyId, [FromBody] PropertyAmenitiesUpdateDto dto)
    {
        try
        {
            await this.amenityService.UpdatePropertyAmenitiesAsync(propertyId, dto.AmenityIds);
            return Ok(new { message = "Property amenities updated successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
