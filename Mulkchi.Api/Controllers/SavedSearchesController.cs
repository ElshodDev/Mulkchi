using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.SavedSearches;
using Mulkchi.Api.Models.Foundations.SavedSearches.Exceptions;
using Mulkchi.Api.Services.Foundations.SavedSearches;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SavedSearchesController : ControllerBase
    {
        private readonly ISavedSearchService savedSearchService;

        public SavedSearchesController(ISavedSearchService savedSearchService)
        {
            this.savedSearchService = savedSearchService;
        }

        [HttpPost]
        [Authorize]
        public async ValueTask<ActionResult<SavedSearch>> PostSavedSearchAsync(SavedSearch savedSearch)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                    return Unauthorized();

                savedSearch.UserId = currentUserId;
                SavedSearch addedSavedSearch = await this.savedSearchService.AddSavedSearchAsync(savedSearch);
                return Created($"/api/savedsearches/{addedSavedSearch.Id}", addedSavedSearch);
            }
            catch (SavedSearchValidationException savedSearchValidationException)
            {
                return BadRequest(new { message = savedSearchValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
            {
                return BadRequest(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
            catch (SavedSearchServiceException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
        }

        [HttpGet]
        [Authorize]
        public ActionResult<PagedResult<SavedSearch>> GetAllSavedSearches([FromQuery] PaginationParams pagination)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                    return Unauthorized();

                IQueryable<SavedSearch> query = this.savedSearchService.RetrieveAllSavedSearches()
                    .Where(s => s.UserId == currentUserId);
                    
                int totalCount = query.Count();

                var items = query
                    .Skip((pagination.Page - 1) * pagination.PageSize)
                    .Take(pagination.PageSize)
                    .ToList();

                var result = new PagedResult<SavedSearch>
                {
                    Items = items,
                    TotalCount = totalCount,
                    Page = pagination.Page,
                    PageSize = pagination.PageSize
                };

                return Ok(result);
            }
            catch (SavedSearchDependencyException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
            catch (SavedSearchServiceException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async ValueTask<ActionResult<SavedSearch>> GetSavedSearchByIdAsync(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                    return Unauthorized();

                SavedSearch savedSearch = await this.savedSearchService.RetrieveSavedSearchByIdAsync(id);
                
                // Check if user owns this saved search
                if (savedSearch.UserId != currentUserId)
                    return Unauthorized();

                return Ok(savedSearch);
            }
            catch (SavedSearchValidationException savedSearchValidationException)
            {
                return BadRequest(new { message = savedSearchValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
                when (savedSearchDependencyValidationException.InnerException is NotFoundSavedSearchException)
            {
                return NotFound(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
            {
                return BadRequest(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
            catch (SavedSearchServiceException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
        }

        [HttpPut]
        [Authorize]
        public async ValueTask<ActionResult<SavedSearch>> PutSavedSearchAsync(SavedSearch savedSearch)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                    return Unauthorized();

                // Check if user owns this saved search when entity is available
                SavedSearch existingSearch = await this.savedSearchService.RetrieveSavedSearchByIdAsync(savedSearch.Id);
                if (existingSearch is not null && existingSearch.UserId != currentUserId)
                    return Unauthorized();

                savedSearch.UserId = currentUserId;
                SavedSearch modifiedSavedSearch = await this.savedSearchService.ModifySavedSearchAsync(savedSearch);
                return Ok(modifiedSavedSearch);
            }
            catch (SavedSearchValidationException savedSearchValidationException)
            {
                return BadRequest(new { message = savedSearchValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
                when (savedSearchDependencyValidationException.InnerException is NotFoundSavedSearchException)
            {
                return NotFound(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
            {
                return BadRequest(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
            catch (SavedSearchServiceException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
        }

        [HttpPut("{id}/toggle")]
        [Authorize]
        public async ValueTask<ActionResult<SavedSearch>> ToggleSavedSearchAsync(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                    return Unauthorized();

                SavedSearch savedSearch = await this.savedSearchService.RetrieveSavedSearchByIdAsync(id);
                
                // Check if user owns this saved search
                if (savedSearch.UserId != currentUserId)
                    return Unauthorized();

                savedSearch.IsActive = !savedSearch.IsActive;
                SavedSearch modifiedSavedSearch = await this.savedSearchService.ModifySavedSearchAsync(savedSearch);
                return Ok(modifiedSavedSearch);
            }
            catch (SavedSearchValidationException savedSearchValidationException)
            {
                return BadRequest(new { message = savedSearchValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
                when (savedSearchDependencyValidationException.InnerException is NotFoundSavedSearchException)
            {
                return NotFound(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
            {
                return BadRequest(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
            catch (SavedSearchServiceException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async ValueTask<ActionResult<SavedSearch>> DeleteSavedSearchByIdAsync(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                    return Unauthorized();

                SavedSearch savedSearch = await this.savedSearchService.RetrieveSavedSearchByIdAsync(id);

                // Check if user owns this saved search when entity is available
                if (savedSearch is not null && savedSearch.UserId != currentUserId)
                    return Unauthorized();

                SavedSearch deletedSavedSearch = await this.savedSearchService.RemoveSavedSearchByIdAsync(id);
                return Ok(deletedSavedSearch);
            }
            catch (SavedSearchValidationException savedSearchValidationException)
            {
                return BadRequest(new { message = savedSearchValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
                when (savedSearchDependencyValidationException.InnerException is NotFoundSavedSearchException)
            {
                return NotFound(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyValidationException savedSearchDependencyValidationException)
            {
                return BadRequest(new { message = savedSearchDependencyValidationException.InnerException?.Message ?? "An error occurred." });
            }
            catch (SavedSearchDependencyException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
            catch (SavedSearchServiceException)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
            }
        }
    }
}
