using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Services.Foundations.Bookings;
using Mulkchi.Api.Services.Foundations.Discounts;
using Mulkchi.Api.Services.Foundations.Payments;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.AI;
using Mulkchi.Api.Services.Foundations.Analytics;
using Mulkchi.Api.Services.Foundations.AiRecommendations;
using Mulkchi.Api.Services.Foundations.Users;
using System.Collections.Generic;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Controllers;

public partial class AnalyticsController : ControllerBase
{
    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult> GetDashboard([FromQuery] DateTimeOffset? startDate = null, [FromQuery] DateTimeOffset? endDate = null)
    {
        try
        {
            var dashboard = await this.dashboardAnalyticsService.GetDashboardAsync(startDate, endDate);
            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetDashboard));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("host-dashboard")]
    [Authorize]
    public ActionResult GetHostDashboard()
    {
        try
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("id");
            if (string.IsNullOrEmpty(currentUserIdStr) || !Guid.TryParse(currentUserIdStr, out Guid userId))
                return Unauthorized(new { message = "User not authorized or ID not found." });

            var properties = this.propertyService.RetrieveAllProperties().Where(p => p.HostId == userId && !p.DeletedDate.HasValue).ToList();
            var propertyIds = properties.Select(p => p.Id).ToList();
            var bookings = this.bookingService.RetrieveAllBookings().Where(b => propertyIds.Contains(b.PropertyId) && !b.DeletedDate.HasValue).ToList();

            int totalListings = properties.Count;
            int totalViews = properties.Sum(p => p.ViewsCount);
            int totalBookings = bookings.Count;

            decimal averageRating = totalListings > 0
                ? (decimal)properties.Average(p => (double)p.AverageRating)
                : 0m;

            decimal totalRevenue = bookings
                .Where(b => b.Status == Models.Foundations.Bookings.BookingStatus.Confirmed || b.Status == Models.Foundations.Bookings.BookingStatus.Completed)
                .Sum(b => b.TotalPrice);

            return Ok(new
            {
                totalListings,
                totalViews,
                totalBookings,
                averageRating = Math.Round(averageRating, 1),
                totalRevenue
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(GetHostDashboard));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

    [HttpGet("export/{type}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public ActionResult ExportDashboard(string type, [FromQuery] string format = "csv")
    {
        try
        {
            var csv = new StringBuilder();
            csv.AppendLine("metric,value");
            csv.AppendLine($"exportType,{type}");
            csv.AppendLine($"generatedAt,{DateTimeOffset.UtcNow:O}");

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            var contentType = format.Equals("pdf", StringComparison.OrdinalIgnoreCase)
                ? "application/pdf"
                : format.Equals("excel", StringComparison.OrdinalIgnoreCase)
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "text/csv";

            var extension = format.Equals("pdf", StringComparison.OrdinalIgnoreCase)
                ? "pdf"
                : format.Equals("excel", StringComparison.OrdinalIgnoreCase)
                    ? "xlsx"
                    : "csv";

            return File(bytes, contentType, $"analytics-{type}.{extension}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(AnalyticsController), nameof(ExportDashboard));
            return StatusCode(500, new { message = "Internal server error." });
        }
    }

}



