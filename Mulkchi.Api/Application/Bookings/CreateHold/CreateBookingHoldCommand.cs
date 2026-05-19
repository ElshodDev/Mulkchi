namespace Mulkchi.Api.Application.Bookings.CreateHold;

public sealed record CreateBookingHoldCommand(
    Guid PropertyId,
    DateTimeOffset CheckInDate,
    DateTimeOffset CheckOutDate);
