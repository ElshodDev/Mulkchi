using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Bookings;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CalendarController : ControllerBase
{
    private readonly IStorageBroker storageBroker;

    public CalendarController(IStorageBroker storageBroker)
    {
        this.storageBroker = storageBroker;
    }

    [HttpGet("export/{propertyId}.ics")]
    [Produces("text/calendar")]
    public async Task<IActionResult> ExportCalendar(Guid propertyId)
    {
        var bookings = await this.storageBroker.SelectAllBookings()
            .Where(b => b.PropertyId == propertyId && b.Status == BookingStatus.Confirmed)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//Mulkchi//Calendar//EN");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine("METHOD:PUBLISH");

        foreach (var booking in bookings)
        {
            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:{booking.Id}@mulkchi.uz");
            sb.AppendLine($"DTSTAMP:{DateTime.UtcNow:yyyyMMddTHHmmssZ}");
            sb.AppendLine($"DTSTART;VALUE=DATE:{booking.CheckInDate:yyyyMMdd}");
            // Add 1 day to CheckOutDate because iCal end date is exclusive
            sb.AppendLine($"DTEND;VALUE=DATE:{booking.CheckOutDate.AddDays(1):yyyyMMdd}");
            sb.AppendLine("SUMMARY:Mulkchi Booking");
            sb.AppendLine("DESCRIPTION:Reserved via Mulkchi platform");
            sb.AppendLine("STATUS:CONFIRMED");
            sb.AppendLine("END:VEVENT");
        }

        sb.AppendLine("END:VCALENDAR");

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/calendar", $"property-{propertyId}.ics");
    }
}
