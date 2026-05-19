#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class FailedBookingServiceException : Xeption
    {
        public FailedBookingServiceException(Exception innerException)
            : base("Failed booking service error occurred, contact support.", innerException) { }
    }
}