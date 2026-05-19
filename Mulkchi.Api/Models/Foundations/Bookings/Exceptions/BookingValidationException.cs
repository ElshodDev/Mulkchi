#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class BookingValidationException : Xeption
    {
        public BookingValidationException(Exception innerException)
            : base("Booking validation error occurred, fix the errors and try again.", innerException) { }
    }
}