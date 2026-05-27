using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Reports;
using Mulkchi.Api.Services.Foundations.Reports;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService reportService;

    public ReportsController(IReportService reportService)
    {
        this.reportService = reportService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async ValueTask<ActionResult<ReportResponse>> PostReportAsync(ReportCreateDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? reporterId = null;
            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out Guid parsed))
                reporterId = parsed;

            var created = await this.reportService.CreateReportAsync(dto, reporterId);
            return CreatedAtAction(nameof(PostReportAsync), new { id = created.Id }, created);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult> GetReportsAsync([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var (items, total) = await this.reportService.RetrieveReportsAsync(page, pageSize);
            return Ok(new { items, total });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async ValueTask<ActionResult<ReportResponse>> PatchReportStatusAsync(Guid id, [FromBody] ReportStatus status)
    {
        try
        {
            var updated = await this.reportService.UpdateReportStatusAsync(id, status);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Report not found." });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
