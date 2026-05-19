namespace Mulkchi.Api.Application.Bookings.CreateHold;

public sealed class CreateBookingHoldResult
{
    public Guid HoldId { get; init; }
    public Guid PropertyId { get; init; }
    public DateTimeOffset CheckInDate { get; init; }
    public DateTimeOffset CheckOutDate { get; init; }
    public DateTimeOffset ExpiresAt { get; init; }
}
