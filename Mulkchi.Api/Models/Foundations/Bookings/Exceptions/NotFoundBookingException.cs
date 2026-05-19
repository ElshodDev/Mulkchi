#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class NotFoundBookingException : Xeption
    {
        public NotFoundBookingException(Guid bookingId)
            : base($"Couldn't find booking with id: {bookingId}.") { }
    }
}