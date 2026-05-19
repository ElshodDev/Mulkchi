#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class BookingServiceException : Xeption
    {
        public BookingServiceException(Exception innerException)
            : base("Booking service error occurred, contact support.", innerException) { }
    }
}