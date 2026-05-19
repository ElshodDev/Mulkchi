using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.PropertyViews;
using Mulkchi.Api.Models.Foundations.PropertyViews.Exceptions;
using Mulkchi.Api.Services.Foundations.PropertyViews;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertyViewsController : ControllerBase
{
    private readonly IPropertyViewService propertyViewService;

    public PropertyViewsController(IPropertyViewService propertyViewService)
    {
        this.propertyViewService = propertyViewService;
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<PropertyView>> PostPropertyViewAsync(PropertyView propertyView)
    {
        try
        {
            propertyView.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var todayStart = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);
            var tomorrowStart = todayStart.AddDays(1);
            bool alreadyViewed = this.propertyViewService.RetrieveAllPropertyViews()
                .Any(v => v.PropertyId == propertyView.PropertyId
                       && v.IpAddress == propertyView.IpAddress
                       && v.CreatedDate >= todayStart
                       && v.CreatedDate < tomorrowStart);
            if (alreadyViewed)
                return Ok(propertyView);

            PropertyView addedPropertyView = await this.propertyViewService.AddPropertyViewAsync(propertyView);
            return Created("propertyView", addedPropertyView);
        }
        catch (PropertyViewValidationException propertyViewValidationException)
        {
            return BadRequest(new { message = propertyViewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyValidationException propertyViewDependencyValidationException)
        {
            return BadRequest(new { message = propertyViewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyViewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [Authorize]
    public ActionResult<PagedResult<PropertyView>> GetAllPropertyViews([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<PropertyView> query = this.propertyViewService.RetrieveAllPropertyViews();
            int totalCount = query.Count();

            var items = query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToList();

            var result = new PagedResult<PropertyView>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (PropertyViewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyViewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<PropertyView>> GetPropertyViewByIdAsync(Guid id)
    {
        try
        {
            PropertyView propertyView = await this.propertyViewService.RetrievePropertyViewByIdAsync(id);
            return Ok(propertyView);
        }
        catch (PropertyViewValidationException propertyViewValidationException)
        {
            return BadRequest(new { message = propertyViewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyValidationException propertyViewDependencyValidationException)
            when (propertyViewDependencyValidationException.InnerException is NotFoundPropertyViewException)
        {
            return NotFound(new { message = propertyViewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyValidationException propertyViewDependencyValidationException)
        {
            return BadRequest(new { message = propertyViewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyViewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<PropertyView>> PutPropertyViewAsync(PropertyView propertyView)
    {
        try
        {
            PropertyView modifiedPropertyView = await this.propertyViewService.ModifyPropertyViewAsync(propertyView);
            return Ok(modifiedPropertyView);
        }
        catch (PropertyViewValidationException propertyViewValidationException)
        {
            return BadRequest(new { message = propertyViewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyValidationException propertyViewDependencyValidationException)
            when (propertyViewDependencyValidationException.InnerException is NotFoundPropertyViewException)
        {
            return NotFound(new { message = propertyViewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyValidationException propertyViewDependencyValidationException)
        {
            return BadRequest(new { message = propertyViewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyViewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<PropertyView>> DeletePropertyViewByIdAsync(Guid id)
    {
        try
        {
            PropertyView deletedPropertyView = await this.propertyViewService.RemovePropertyViewByIdAsync(id);
            return Ok(deletedPropertyView);
        }
        catch (PropertyViewValidationException propertyViewValidationException)
        {
            return BadRequest(new { message = propertyViewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyValidationException propertyViewDependencyValidationException)
            when (propertyViewDependencyValidationException.InnerException is NotFoundPropertyViewException)
        {
            return NotFound(new { message = propertyViewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyValidationException propertyViewDependencyValidationException)
        {
            return BadRequest(new { message = propertyViewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PropertyViewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PropertyViewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
