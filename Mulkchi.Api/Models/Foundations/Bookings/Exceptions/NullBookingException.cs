#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class NullBookingException : Xeption
    {
        public NullBookingException()
            : base("Booking is null.") { }
    }
}