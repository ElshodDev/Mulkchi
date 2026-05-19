using System;

namespace Mulkchi.Api.Models.Foundations.Bookings
{
    public class BookingCreateDto
    {
        public Guid PropertyId { get; set; }
        public DateTimeOffset CheckInDate { get; set; }
        public DateTimeOffset CheckOutDate { get; set; }
        public decimal TotalPrice { get; set; }
    }
}