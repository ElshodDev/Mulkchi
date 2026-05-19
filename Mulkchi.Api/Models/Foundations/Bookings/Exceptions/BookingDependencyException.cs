#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class BookingDependencyException : Xeption
    {
        public BookingDependencyException(Exception innerException)
            : base("Booking dependency error occurred, contact support.", innerException) { }
    }
}