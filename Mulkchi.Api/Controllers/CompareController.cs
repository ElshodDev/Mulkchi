using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Compare;
using Mulkchi.Api.Services.Foundations.Compare;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompareController : ControllerBase
{
    private readonly ICompareService compareService;

    public CompareController(ICompareService compareService)
    {
        this.compareService = compareService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async ValueTask<ActionResult<ComparisonResult>> CompareProperties([FromBody] List<Guid> propertyIds)
    {
        try
        {
            if (propertyIds == null || propertyIds.Count < 2)
                return BadRequest(new { message = "At least 2 property IDs are required for comparison." });

            if (propertyIds.Count > 5)
                return BadRequest(new { message = "Maximum 5 properties can be compared at once." });

            var result = await this.compareService.ComparePropertiesAsync(propertyIds);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async ValueTask<ActionResult<ComparisonResult>> ComparePropertiesGet([FromQuery] string ids)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(ids))
                return BadRequest(new { message = "Property IDs are required." });

            var propertyIds = ids.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(id => Guid.TryParse(id.Trim(), out var guid) ? guid : (Guid?)null)
                .Where(g => g.HasValue)
                .Select(g => g!.Value)
                .ToList();

            if (propertyIds.Count < 2)
                return BadRequest(new { message = "At least 2 valid property IDs are required." });

            if (propertyIds.Count > 5)
                return BadRequest(new { message = "Maximum 5 properties can be compared at once." });

            var result = await this.compareService.ComparePropertiesAsync(propertyIds);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("summary")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<string>> GetComparisonSummary([FromQuery] string ids)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(ids))
                return BadRequest(new { message = "Property IDs are required." });

            var propertyIds = ids.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(id => Guid.TryParse(id.Trim(), out var guid) ? guid : (Guid?)null)
                .Where(g => g.HasValue)
                .Select(g => g!.Value)
                .ToList();

            if (propertyIds.Count < 2)
                return BadRequest(new { message = "At least 2 valid property IDs are required." });

            var summary = await this.compareService.GenerateComparisonSummaryAsync(propertyIds);
            return Ok(new { summary });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
