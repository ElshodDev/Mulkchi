#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class AlreadyExistsBookingException : Xeption
    {
        public AlreadyExistsBookingException(Guid bookingId)
            : base($"Booking with id {bookingId} already exists.") { }
    }
}