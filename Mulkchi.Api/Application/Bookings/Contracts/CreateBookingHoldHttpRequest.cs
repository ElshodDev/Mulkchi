namespace Mulkchi.Api.Application.Bookings.Contracts;

public sealed class CreateBookingHoldHttpRequest
{
    public Guid PropertyId { get; set; }
    public DateTimeOffset CheckInDate { get; set; }
    public DateTimeOffset CheckOutDate { get; set; }
}
