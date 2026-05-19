using Mulkchi.Api.Models.Foundations.Common;
using System;

namespace Mulkchi.Api.Models.Foundations.Bookings
{
    public class BookingQueryParams
    {
        public bool IsHostView { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public Guid? UserId { get; set; } // Used internally by service
    }
}