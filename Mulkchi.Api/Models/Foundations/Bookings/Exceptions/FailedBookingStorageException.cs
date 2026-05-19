#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Bookings.Exceptions
{
    public class FailedBookingStorageException : Xeption
    {
        public FailedBookingStorageException(Exception innerException)
            : base("Failed booking storage error occurred, contact support.", innerException) { }
    }
}