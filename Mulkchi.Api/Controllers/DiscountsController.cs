using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Discounts;
using Mulkchi.Api.Models.Foundations.Discounts.Exceptions;
using Mulkchi.Api.Services.Foundations.Discounts;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscountsController : ControllerBase
{
    private readonly IDiscountService discountService;

    public DiscountsController(IDiscountService discountService)
    {
        this.discountService = discountService;
    }

    public sealed class DiscountValidateRequest
    {
        public string Code { get; set; } = string.Empty;
    }

    public sealed class DiscountValidateResponse
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public Discount? Discount { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Host")]
    public async ValueTask<ActionResult<Discount>> PostDiscountAsync(Discount discount)
    {
        try
        {
            Discount addedDiscount = await this.discountService.AddDiscountAsync(discount);
            return Created("discount", addedDiscount);
        }
        catch (DiscountValidationException discountValidationException)
        {
            return BadRequest(new { message = discountValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyValidationException discountDependencyValidationException)
        {
            return BadRequest(new { message = discountDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (DiscountServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public ActionResult<PagedResult<Discount>> GetAllDiscounts([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<Discount> query = this.discountService.RetrieveAllDiscounts()
                .Where(d => d.IsActive);
            int totalCount = query.Count();

            var items = query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToList();

            var result = new PagedResult<Discount>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (DiscountDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (DiscountServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<Discount>> GetDiscountByIdAsync(Guid id)
    {
        try
        {
            Discount discount = await this.discountService.RetrieveDiscountByIdAsync(id);
            return Ok(discount);
        }
        catch (DiscountValidationException discountValidationException)
        {
            return BadRequest(new { message = discountValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyValidationException discountDependencyValidationException)
            when (discountDependencyValidationException.InnerException is NotFoundDiscountException)
        {
            return NotFound(new { message = discountDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyValidationException discountDependencyValidationException)
        {
            return BadRequest(new { message = discountDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (DiscountServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<Discount>> GetActiveDiscounts()
    {
        try
        {
            var now = DateTimeOffset.UtcNow;
            var activeDiscounts = this.discountService
                .RetrieveAllDiscounts()
                .Where(discount =>
                    discount.IsActive &&
                    (!discount.StartsAt.HasValue || discount.StartsAt.Value <= now) &&
                    (!discount.ExpiresAt.HasValue || discount.ExpiresAt.Value >= now) &&
                    (!discount.MaxUsageCount.HasValue || discount.UsageCount < discount.MaxUsageCount.Value))
                .ToList();

            return Ok(activeDiscounts);
        }
        catch (DiscountDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (DiscountServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPost("validate")]
    [AllowAnonymous]
    public ActionResult<DiscountValidateResponse> ValidateDiscountCode([FromBody] DiscountValidateRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new DiscountValidateResponse
            {
                IsValid = false,
                Message = "Discount code is required."
            });
        }

        var now = DateTimeOffset.UtcNow;
        var normalizedCode = request.Code.Trim().ToLower();

        var discount = this.discountService
            .RetrieveAllDiscounts()
            .FirstOrDefault(d => d.Code.ToLower() == normalizedCode && d.IsActive);

        if (discount is null)
        {
            return Ok(new DiscountValidateResponse
            {
                IsValid = false,
                Message = "Discount code is invalid."
            });
        }

        if (discount.StartsAt.HasValue && discount.StartsAt.Value > now)
        {
            return Ok(new DiscountValidateResponse
            {
                IsValid = false,
                Message = "Discount is not active yet.",
                Discount = discount
            });
        }

        if (discount.ExpiresAt.HasValue && discount.ExpiresAt.Value < now)
        {
            return Ok(new DiscountValidateResponse
            {
                IsValid = false,
                Message = "Discount has expired.",
                Discount = discount
            });
        }

        if (discount.MaxUsageCount.HasValue && discount.UsageCount >= discount.MaxUsageCount.Value)
        {
            return Ok(new DiscountValidateResponse
            {
                IsValid = false,
                Message = "Discount usage limit reached.",
                Discount = discount
            });
        }

        return Ok(new DiscountValidateResponse
        {
            IsValid = true,
            Message = "Discount is valid.",
            Discount = discount
        });
    }

    [HttpPut]
    [Authorize(Roles = "Admin,Host")]
    public async ValueTask<ActionResult<Discount>> PutDiscountAsync(Discount discount)
    {
        try
        {
            Discount modifiedDiscount = await this.discountService.ModifyDiscountAsync(discount);
            return Ok(modifiedDiscount);
        }
        catch (DiscountValidationException discountValidationException)
        {
            return BadRequest(new { message = discountValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyValidationException discountDependencyValidationException)
            when (discountDependencyValidationException.InnerException is NotFoundDiscountException)
        {
            return NotFound(new { message = discountDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyValidationException discountDependencyValidationException)
        {
            return BadRequest(new { message = discountDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (DiscountServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Host")]
    public async ValueTask<ActionResult<Discount>> DeleteDiscountByIdAsync(Guid id)
    {
        try
        {
            Discount deletedDiscount = await this.discountService.RemoveDiscountByIdAsync(id);
            return Ok(deletedDiscount);
        }
        catch (DiscountValidationException discountValidationException)
        {
            return BadRequest(new { message = discountValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyValidationException discountDependencyValidationException)
            when (discountDependencyValidationException.InnerException is NotFoundDiscountException)
        {
            return NotFound(new { message = discountDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyValidationException discountDependencyValidationException)
        {
            return BadRequest(new { message = discountDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (DiscountDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (DiscountServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
