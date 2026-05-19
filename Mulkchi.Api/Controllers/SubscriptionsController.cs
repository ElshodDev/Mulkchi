using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Subscriptions;
using Mulkchi.Api.Services.Foundations.Subscriptions;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        this.subscriptionService = subscriptionService;
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<SubscriptionPlan>> GetAllPlans()
    {
        try
        {
            var plans = this.subscriptionService.GetAllPlans();
            return Ok(plans);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("plans/{id:guid}")]
    [AllowAnonymous]
    public ActionResult<SubscriptionPlan> GetPlanById(Guid id)
    {
        try
        {
            var plan = this.subscriptionService.GetPlanById(id);
            if (plan is null)
                return NotFound(new { message = "Plan not found." });
            return Ok(plan);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("my")]
    [Authorize]
    public async ValueTask<ActionResult<SubscriptionResponse>> GetMySubscriptionAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var subscription = await this.subscriptionService.GetMySubscriptionAsync(userId);
            if (subscription is null)
                return Ok(new { message = "No active subscription found.", isSubscribed = false });

            return Ok(subscription);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<SubscriptionResponse>> SubscribeAsync([FromBody] SubscriptionCreateDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var subscription = await this.subscriptionService.SubscribeAsync(dto, userId);
            return Ok(subscription);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("cancel")]
    [Authorize]
    public async ValueTask<ActionResult<SubscriptionResponse>> CancelSubscriptionAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var subscription = await this.subscriptionService.CancelSubscriptionAsync(userId);
            if (subscription is null)
                return NotFound(new { message = "No active subscription found." });

            return Ok(subscription);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("upgrade")]
    [Authorize]
    public async ValueTask<ActionResult<SubscriptionResponse>> UpgradeSubscriptionAsync([FromQuery] Guid planId)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var subscription = await this.subscriptionService.UpgradeSubscriptionAsync(planId, userId);
            return Ok(subscription);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult<IEnumerable<SubscriptionResponse>>> GetAllSubscriptionsAsync()
    {
        try
        {
            var subscriptions = await this.subscriptionService.GetAllSubscriptionsAsync();
            return Ok(subscriptions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("can-list")]
    [Authorize(Roles = "Host,Admin")]
    public async ValueTask<ActionResult<object>> CanCreateListingAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var canCreate = await this.subscriptionService.CanCreateListingAsync(userId);
            var currentCount = await this.subscriptionService.GetUserListingCountAsync(userId);

            return Ok(new { canCreate, currentCount });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("remaining-boosts")]
    [Authorize(Roles = "Host,Admin")]
    public async ValueTask<ActionResult<object>> GetRemainingBoostsAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var count = await this.subscriptionService.GetRemainingBoostsAsync(userId);
            return Ok(new { remainingBoosts = count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("expire")]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult> ExpireSubscriptionsAsync()
    {
        try
        {
            await this.subscriptionService.ExpireSubscriptionsAsync();
            return Ok(new { message = "Expired subscriptions processed successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("expiring-soon")]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult<IEnumerable<SubscriptionResponse>>> GetExpiringSoonAsync([FromQuery] int days = 7)
    {
        try
        {
            var subscriptions = await this.subscriptionService.GetExpiringSoonAsync(days);
            return Ok(subscriptions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
