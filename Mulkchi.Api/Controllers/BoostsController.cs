using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Boosts;
using Mulkchi.Api.Services.Foundations.Boosts;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoostsController : ControllerBase
{
    private readonly IBoostService boostService;

    public BoostsController(IBoostService boostService)
    {
        this.boostService = boostService;
    }

    [HttpPost]
    [Authorize(Roles = "Host,Admin")]
    public async ValueTask<ActionResult<BoostResponse>> CreateBoostAsync([FromBody] BoostCreateDto dto)
    {
        try
        {
            var boost = await this.boostService.AddBoostAsync(dto);
            return Ok(boost);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public ActionResult<IEnumerable<Boost>> GetAllBoosts()
    {
        try
        {
            var boosts = this.boostService.RetrieveAllBoosts().ToList();
            return Ok(boosts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("my")]
    [Authorize(Roles = "Host,Admin")]
    public async ValueTask<ActionResult<IEnumerable<BoostResponse>>> GetMyBoostsAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var boosts = await this.boostService.RetrieveMyBoostsAsync(userId);
            return Ok(boosts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<IEnumerable<BoostResponse>>> GetActiveBoostsAsync()
    {
        try
        {
            var boosts = await this.boostService.RetrieveAllActiveBoostsAsync();
            return Ok(boosts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<BoostPlanDto>> GetAvailablePlans()
    {
        try
        {
            var plans = this.boostService.GetAvailablePlans();
            return Ok(plans);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Host,Admin")]
    public async ValueTask<ActionResult<BoostResponse>> GetBoostByIdAsync(Guid id)
    {
        try
        {
            var boost = await this.boostService.RetrieveBoostResponseByIdAsync(id);
            return Ok(boost);
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
    [Authorize(Roles = "Host,Admin")]
    public async ValueTask<ActionResult<Boost>> CancelBoostAsync(Guid id)
    {
        try
        {
            var boost = await this.boostService.RemoveBoostByIdAsync(id);
            return Ok(boost);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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

    [HttpPost("expire")]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult> ExpireBoostsAsync()
    {
        try
        {
            await this.boostService.ExpireBoostsAsync();
            return Ok(new { message = "Expired boosts processed successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
