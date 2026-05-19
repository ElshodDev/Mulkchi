using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Reviews;
using Mulkchi.Api.Models.Foundations.Reviews.Exceptions;
using Mulkchi.Api.Services.Foundations.Reviews;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        this.reviewService = reviewService;
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<Review>> PostReviewAsync(Review review)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            review.ReviewerId = currentUserId;
            Review addedReview = await this.reviewService.AddReviewAsync(review);
            return Created("review", addedReview);
        }
        catch (ReviewValidationException reviewValidationException)
        {
            return BadRequest(new { message = reviewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyValidationException reviewDependencyValidationException)
        {
            return BadRequest(new { message = reviewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (ReviewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<Review>>> GetAllReviews([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<Review> query = this.reviewService.RetrieveAllReviews();
            int totalCount = await query.CountAsync();

            var items = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            var result = new PagedResult<Review>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (ReviewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (ReviewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<Review>> GetReviewByIdAsync(Guid id)
    {
        try
        {
            Review review = await this.reviewService.RetrieveReviewByIdAsync(id);
            return Ok(review);
        }
        catch (ReviewValidationException reviewValidationException)
        {
            return BadRequest(new { message = reviewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyValidationException reviewDependencyValidationException)
            when (reviewDependencyValidationException.InnerException is NotFoundReviewException)
        {
            return NotFound(new { message = reviewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyValidationException reviewDependencyValidationException)
        {
            return BadRequest(new { message = reviewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (ReviewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("property/{propertyId}")]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<object>>> GetReviewsByPropertyAsync(
        Guid propertyId,
        [FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<Review> query = this.reviewService
                .RetrieveAllReviews()
                .Where(review => review.PropertyId == propertyId)
                .OrderByDescending(review => review.CreatedDate);

            int totalCount = await query.CountAsync();

            var items = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(review => new
                {
                    id = review.Id,
                    authorName = "Foydalanuvchi",
                    authorAvatarUrl = (string?)null,
                    rating = review.OverallRating,
                    comment = review.Comment,
                    createdDate = review.CreatedDate,
                    cleanliness = review.CleanlinessRating,
                    location = review.LocationRating,
                    value = review.ValueRating,
                    communication = review.CommunicationRating
                })
                .ToListAsync();

            var result = new PagedResult<object>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (ReviewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (ReviewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("property/{propertyId}/summary")]
    [AllowAnonymous]
    public ActionResult<object> GetReviewSummaryByProperty(Guid propertyId)
    {
        try
        {
            var propertyReviews = this.reviewService
                .RetrieveAllReviews()
                .Where(review => review.PropertyId == propertyId)
                .ToList();

            if (propertyReviews.Count == 0)
            {
                return Ok(new
                {
                    averageRating = 0m,
                    totalReviews = 0,
                    cleanliness = 0m,
                    location = 0m,
                    value = 0m,
                    communication = 0m,
                    ratingDistribution = new Dictionary<int, int>
                    {
                        { 1, 0 },
                        { 2, 0 },
                        { 3, 0 },
                        { 4, 0 },
                        { 5, 0 }
                    }
                });
            }

            var distribution = new Dictionary<int, int>
            {
                { 1, 0 },
                { 2, 0 },
                { 3, 0 },
                { 4, 0 },
                { 5, 0 }
            };

            foreach (var review in propertyReviews)
            {
                int score = (int)Math.Round(review.OverallRating, MidpointRounding.AwayFromZero);
                if (score < 1) score = 1;
                if (score > 5) score = 5;
                distribution[score]++;
            }

            return Ok(new
            {
                averageRating = Math.Round(propertyReviews.Average(review => review.OverallRating), 2),
                totalReviews = propertyReviews.Count,
                cleanliness = Math.Round(propertyReviews.Average(review => review.CleanlinessRating), 2),
                location = Math.Round(propertyReviews.Average(review => review.LocationRating), 2),
                value = Math.Round(propertyReviews.Average(review => review.ValueRating), 2),
                communication = Math.Round(propertyReviews.Average(review => review.CommunicationRating), 2),
                ratingDistribution = distribution
            });
        }
        catch (ReviewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (ReviewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<Review>> PutReviewAsync(Review review)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            if (!isAdmin)
            {
                Review existingReview = await this.reviewService.RetrieveReviewByIdAsync(review.Id);
                if (existingReview is null)
                    return NotFound(new { message = "Review not found." });

                if (existingReview.ReviewerId != currentUserId)
                    return Forbid();
            }

            Review modifiedReview = await this.reviewService.ModifyReviewAsync(review);
            return Ok(modifiedReview);
        }
        catch (ReviewValidationException reviewValidationException)
        {
            return BadRequest(new { message = reviewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyValidationException reviewDependencyValidationException)
            when (reviewDependencyValidationException.InnerException is NotFoundReviewException)
        {
            return NotFound(new { message = reviewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyValidationException reviewDependencyValidationException)
        {
            return BadRequest(new { message = reviewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (ReviewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<Review>> DeleteReviewByIdAsync(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            if (!isAdmin)
            {
                Review existingReview = await this.reviewService.RetrieveReviewByIdAsync(id);
                if (existingReview is null)
                    return NotFound(new { message = "Review not found." });

                if (existingReview.ReviewerId != currentUserId)
                    return Forbid();
            }

            Review deletedReview = await this.reviewService.RemoveReviewByIdAsync(id);
            return Ok(deletedReview);
        }
        catch (ReviewValidationException reviewValidationException)
        {
            return BadRequest(new { message = reviewValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyValidationException reviewDependencyValidationException)
            when (reviewDependencyValidationException.InnerException is NotFoundReviewException)
        {
            return NotFound(new { message = reviewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyValidationException reviewDependencyValidationException)
        {
            return BadRequest(new { message = reviewDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (ReviewDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (ReviewServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
