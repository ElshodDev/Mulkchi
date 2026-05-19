using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.PropertyImages.Exceptions;
using Mulkchi.Api.Services.Foundations.PropertyImages;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertyImagesController : ControllerBase
{
    private readonly IPropertyImageService propertyImageService;

    public PropertyImagesController(IPropertyImageService propertyImageService)
    {
        this.propertyImageService = propertyImageService;
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<PropertyImage>> PostPropertyImageAsync(PropertyImage propertyImage)
    {
        try
        {
            PropertyImage addedPropertyImage = await this.propertyImageService.AddPropertyImageAsync(propertyImage);
            return Created("propertyImage", addedPropertyImage);
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
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyImageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResult<PropertyImage>>> GetAllPropertyImages([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<PropertyImage> query = this.propertyImageService.RetrieveAllPropertyImages();
            int totalCount = await query.CountAsync();

            var items = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            var result = new PagedResult<PropertyImage>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (PropertyImageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyImageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<PropertyImage>> GetPropertyImageByIdAsync(Guid id)
    {
        try
        {
            PropertyImage propertyImage = await this.propertyImageService.RetrievePropertyImageByIdAsync(id);
            return Ok(propertyImage);
        }
        catch (PropertyImageValidationException propertyImageValidationException)
        {
            return BadRequest(new { message = propertyImageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
            when (propertyImageDependencyValidationException.InnerException is NotFoundPropertyImageException)
        {
            return NotFound(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
        {
            return BadRequest(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyImageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<PropertyImage>> PutPropertyImageAsync(PropertyImage propertyImage)
    {
        try
        {
            PropertyImage modifiedPropertyImage = await this.propertyImageService.ModifyPropertyImageAsync(propertyImage);
            return Ok(modifiedPropertyImage);
        }
        catch (PropertyImageValidationException propertyImageValidationException)
        {
            return BadRequest(new { message = propertyImageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
            when (propertyImageDependencyValidationException.InnerException is NotFoundPropertyImageException)
        {
            return NotFound(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
        {
            return BadRequest(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyImageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<PropertyImage>> DeletePropertyImageByIdAsync(Guid id)
    {
        try
        {
            PropertyImage deletedPropertyImage = await this.propertyImageService.RemovePropertyImageByIdAsync(id);
            return Ok(deletedPropertyImage);
        }
        catch (PropertyImageValidationException propertyImageValidationException)
        {
            return BadRequest(new { message = propertyImageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
            when (propertyImageDependencyValidationException.InnerException is NotFoundPropertyImageException)
        {
            return NotFound(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyValidationException propertyImageDependencyValidationException)
        {
            return BadRequest(new { message = propertyImageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyImageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyImageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
