#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class InvalidBookingException : Xeption
    {
        public InvalidBookingException(string message)
            : base(message) { }
    }
}