#nullable disable

using System;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Bookings
{
    public class Booking
    {
        public Guid Id { get; set; }
        public Guid PropertyId { get; set; }
        public Property Property { get; set; }
        public Guid GuestId { get; set; }
        public User Guest { get; set; }
        public DateTimeOffset CheckInDate { get; set; }
        public DateTimeOffset CheckOutDate { get; set; }
        public int NumberOfGuests { get; set; }
        public decimal TotalPrice { get; set; }
        public BookingStatus Status { get; set; }
        public string Notes { get; set; }
        public DateTimeOffset CreatedDate { get; set; }
        public DateTimeOffset UpdatedDate { get; set; }
        public DateTimeOffset? DeletedDate { get; set; }
    }
}