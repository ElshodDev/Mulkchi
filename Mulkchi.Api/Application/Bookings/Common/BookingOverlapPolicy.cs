using Mulkchi.Api.Models.Foundations.Bookings;

namespace Mulkchi.Api.Application.Bookings.Common;

public static class BookingOverlapPolicy
{
    public static bool IsOverlapping(
        DateTimeOffset startA,
        DateTimeOffset endA,
        DateTimeOffset startB,
        DateTimeOffset endB) =>
        startA < endB && endA > startB;

    public static bool ConflictsWithBooking(
        Booking booking,
        Guid propertyId,
        DateTimeOffset checkInDate,
        DateTimeOffset checkOutDate) =>
        booking.PropertyId == propertyId &&
        booking.Status != BookingStatus.Cancelled &&
        IsOverlapping(booking.CheckInDate, booking.CheckOutDate, checkInDate, checkOutDate);
}
