#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Bookings;

namespace Mulkchi.Api.Services.Foundations.Bookings
{
    public interface IBookingService
    {
        ValueTask<BookingResponse> AddBookingAsync(BookingCreateDto dto);
        ValueTask<Booking> AddBookingAsync(Booking booking);
        ValueTask<(IEnumerable<BookingResponse> Items, int TotalCount)> RetrieveBookingsAsync(BookingQueryParams queryParams);
        ValueTask<BookingResponse> RetrieveBookingByIdAsync(Guid bookingId);
        ValueTask<BookingResponse> ConfirmBookingAsync(Guid bookingId);
        ValueTask<BookingResponse> CancelBookingAsync(Guid bookingId);
        
        // Availability: returns all booked/blocked dates for a property in a given month
        Task<IEnumerable<DateOnly>> RetrieveBlockedDatesAsync(Guid propertyId, int year, int month);

        // ── Phantom-booking protection (pessimistic lock) ─────────────────
        /// <summary>
        /// Creates a 10-minute exclusive hold on the requested dates so that
        /// concurrent users cannot book the same slot.
        /// Throws <see cref="InvalidOperationException"/> if the slot is already held or booked.
        /// </summary>
        ValueTask<BookingHold> CreateBookingHoldAsync(Guid propertyId, DateTimeOffset checkIn, DateTimeOffset checkOut);

        /// <summary>Releases an active hold before its natural expiry.</summary>
        ValueTask ReleaseBookingHoldAsync(Guid holdId);

        // Legacy methods maintained if internally referenced
        IQueryable<Booking> RetrieveAllBookings();
        ValueTask<Booking> ModifyBookingAsync(Booking booking);
        ValueTask<Booking> RemoveBookingAsync(Guid bookingId);
    }
}
