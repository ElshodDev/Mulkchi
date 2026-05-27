using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Announcements;
using Mulkchi.Api.Models.Foundations.Announcements.Exceptions;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Services.Foundations.Announcements;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService announcementService;

    public AnnouncementsController(IAnnouncementService announcementService)
    {
        this.announcementService = announcementService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async ValueTask<ActionResult<Announcement>> PostAnnouncementAsync(Announcement announcement)
    {
        try
        {
            Announcement addedAnnouncement = await this.announcementService.AddAnnouncementAsync(announcement);
            return Created("announcement", addedAnnouncement);
        }
        catch (AnnouncementValidationException announcementValidationException)
        {
            return BadRequest(new { message = announcementValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyValidationException announcementDependencyValidationException)
        {
            return BadRequest(new { message = announcementDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AnnouncementServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public ActionResult<PagedResult<Announcement>> GetAllAnnouncements([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<Announcement> query = this.announcementService.RetrieveAllAnnouncements()
                .Where(a => a.ExpiresAt == null || a.ExpiresAt > DateTimeOffset.UtcNow);
            int totalCount = query.Count();

            var items = query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToList();

            var result = new PagedResult<Announcement>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (AnnouncementDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AnnouncementServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<Announcement>> GetAnnouncementByIdAsync(Guid id)
    {
        try
        {
            Announcement announcement = await this.announcementService.RetrieveAnnouncementByIdAsync(id);
            return Ok(announcement);
        }
        catch (AnnouncementValidationException announcementValidationException)
        {
            return BadRequest(new { message = announcementValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyValidationException announcementDependencyValidationException)
            when (announcementDependencyValidationException.InnerException is NotFoundAnnouncementException)
        {
            return NotFound(new { message = announcementDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyValidationException announcementDependencyValidationException)
        {
            return BadRequest(new { message = announcementDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AnnouncementServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPut]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async ValueTask<ActionResult<Announcement>> PutAnnouncementAsync(Announcement announcement)
    {
        try
        {
            Announcement modifiedAnnouncement = await this.announcementService.ModifyAnnouncementAsync(announcement);
            return Ok(modifiedAnnouncement);
        }
        catch (AnnouncementValidationException announcementValidationException)
        {
            return BadRequest(new { message = announcementValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyValidationException announcementDependencyValidationException)
            when (announcementDependencyValidationException.InnerException is NotFoundAnnouncementException)
        {
            return NotFound(new { message = announcementDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyValidationException announcementDependencyValidationException)
        {
            return BadRequest(new { message = announcementDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AnnouncementServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async ValueTask<ActionResult<Announcement>> DeleteAnnouncementByIdAsync(Guid id)
    {
        try
        {
            Announcement deletedAnnouncement = await this.announcementService.RemoveAnnouncementByIdAsync(id);
            return Ok(deletedAnnouncement);
        }
        catch (AnnouncementValidationException announcementValidationException)
        {
            return BadRequest(new { message = announcementValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyValidationException announcementDependencyValidationException)
            when (announcementDependencyValidationException.InnerException is NotFoundAnnouncementException)
        {
            return NotFound(new { message = announcementDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyValidationException announcementDependencyValidationException)
        {
            return BadRequest(new { message = announcementDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AnnouncementDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AnnouncementServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
