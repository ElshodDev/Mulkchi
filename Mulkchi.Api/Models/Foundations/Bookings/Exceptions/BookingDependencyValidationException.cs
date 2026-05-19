#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class BookingDependencyValidationException : Xeption
    {
        public BookingDependencyValidationException(Exception innerException)
            : base("Booking dependency validation error occurred, fix the errors and try again.", innerException) { }
    }
}