using System;

namespace Mulkchi.Api.Models.Foundations.Bookings;

public class CreateBookingRequest
{
    public Guid PropertyId { get; set; }
    public DateTimeOffset CheckInDate { get; set; }
    public DateTimeOffset CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public string Notes { get; set; }
}

