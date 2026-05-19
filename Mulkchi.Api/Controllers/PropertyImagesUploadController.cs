using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.PropertyImages.Exceptions;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.PropertyImages;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertyImagesUploadController : ControllerBase
{
    private const int MaxImagesPerProperty = 20;

    private readonly IPropertyImageService propertyImageService;
    private readonly IFileStorageBroker fileStorageBroker;
    private readonly IPropertyService propertyService;
    private readonly ILogger<PropertyImagesUploadController> logger;

    public PropertyImagesUploadController(
        IPropertyImageService propertyImageService,
        IFileStorageBroker fileStorageBroker,
        IPropertyService propertyService,
        ILogger<PropertyImagesUploadController> logger)
    {
        this.propertyImageService = propertyImageService;
        this.fileStorageBroker = fileStorageBroker;
        this.propertyService = propertyService;
        this.logger = logger;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Host,Admin")]
    public async Task<ActionResult<PropertyImage>> UploadPropertyImage([FromForm] PropertyImageUploadRequest request)
    {
        try
        {
            if (request.File == null || request.PropertyId == Guid.Empty)
                return BadRequest(new { message = "Fayl va PropertyId majburiy." });

            this.logger.LogInformation("Attempting to upload image for property {PropertyId}", request.PropertyId);

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            ActionResult ownershipResult = await VerifyPropertyOwnershipAsync(request.PropertyId, currentUserId);
            if (ownershipResult is not OkResult)
                return ownershipResult;

            // Enforce 20-image limit per property
            var existingImages = this.propertyImageService.RetrieveAllPropertyImages()
                .Where(img => img.PropertyId == request.PropertyId);
            int currentCount = existingImages.Count();
            if (currentCount >= MaxImagesPerProperty)
                return BadRequest(new { message = $"Har bir mulk uchun maksimal {MaxImagesPerProperty} ta rasm yuklab olish mumkin." });

            // Upload file and create WebP variants after ownership is verified
            ImageVariants variants = await fileStorageBroker.UploadImageVariantsAsync(request.File, "property-images");

            bool isFirst = currentCount == 0;

            var propertyImage = new PropertyImage
            {
                Id = Guid.NewGuid(),
                PropertyId = request.PropertyId,
                Url = variants.Full,
                MediumUrl = variants.Medium,
                ThumbnailUrl = variants.Thumbnail,
                IsPrimary = isFirst, // first image becomes primary automatically
                SortOrder = currentCount,
                CreatedDate = DateTimeOffset.UtcNow,
                UpdatedDate = DateTimeOffset.UtcNow
            };

            PropertyImage addedPropertyImage = await propertyImageService.AddPropertyImageAsync(propertyImage);
            this.logger.LogInformation("Successfully uploaded image {ImageId} for property {PropertyId}", addedPropertyImage.Id, request.PropertyId);
            return Created($"property-images/{addedPropertyImage.Id}", addedPropertyImage);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (PropertyImageValidationException propertyImageValidationException)
        {
            return BadRequest(new { message = propertyImageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
        {
            return BadRequest(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "A dependency error occurred." });
        }
        catch (PropertyImageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "A service error occurred." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Host,Admin")]
    public async Task<ActionResult> DeletePropertyImage(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            PropertyImage propertyImage = await propertyImageService.RetrievePropertyImageByIdAsync(id);
            if (propertyImage == null)
                return NotFound();

            ActionResult ownershipResult = await VerifyPropertyOwnershipAsync(propertyImage.PropertyId, currentUserId);
            if (ownershipResult is not OkResult)
                return ownershipResult;

            // Delete all size variants from storage
            await fileStorageBroker.DeleteImageAsync(propertyImage.Url);

            // Delete record from database
            await propertyImageService.RemovePropertyImageByIdAsync(id);

            this.logger.LogInformation("Successfully deleted property image {ImageId}", id);
            return NoContent();
        }
        catch (PropertyImageValidationException propertyImageValidationException)
        {
            return BadRequest(new { message = propertyImageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
        {
            return BadRequest(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "A dependency error occurred." });
        }
        catch (PropertyImageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "A service error occurred." });
        }
    }

    private async Task<ActionResult> VerifyPropertyOwnershipAsync(Guid propertyId, Guid currentUserId)
    {
        if (User.IsInRole("Admin"))
            return Ok();

        Property? property = await this.propertyService.RetrievePropertyByIdAsync(propertyId);
        if (property is null)
            return NotFound(new { message = "Property not found." });

        if (property.HostId != currentUserId)
            return Forbid();

        return Ok();
    }
}

public class PropertyImageUploadRequest
{
    public IFormFile File { get; set; }
    public Guid PropertyId { get; set; }
}
