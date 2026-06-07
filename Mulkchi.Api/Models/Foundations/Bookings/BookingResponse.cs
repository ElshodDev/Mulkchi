using System;

namespace Mulkchi.Api.Models.Foundations.Bookings
{
    public class BookingResponse
    {
        public Guid Id { get; set; }
        public Guid PropertyId { get; set; }
        public Guid GuestId { get; set; }
        public DateTimeOffset CheckInDate { get; set; }
        public DateTimeOffset CheckOutDate { get; set; }
        public decimal TotalPrice { get; set; }
        public BookingStatus Status { get; set; }
        public string Notes { get; set; }
        public int NumberOfGuests { get; set; }
        public DateTimeOffset CreatedDate { get; set; }
        public DateTimeOffset UpdatedDate { get; set; }
        public PropertySummaryResponse Property { get; set; }
        public GuestSummaryResponse Guest { get; set; }
    }

    public class PropertySummaryResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string MainImageUrl { get; set; }
        public string City { get; set; }
        public string District { get; set; }
    }

    public class GuestSummaryResponse
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string AvatarUrl { get; set; }
        public string Phone { get; set; }
    }
}