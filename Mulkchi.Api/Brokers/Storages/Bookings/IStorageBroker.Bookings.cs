#nullable disable

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Mulkchi.Api.Models.Foundations.Bookings;

namespace Mulkchi.Api.Brokers.Storages
{
    public partial interface IStorageBroker
    {
        ValueTask<Booking> InsertBookingAsync(Booking booking);
        IQueryable<Booking> SelectAllBookings();
        ValueTask<Booking> SelectBookingByIdAsync(Guid bookingId);
        ValueTask<Booking> UpdateBookingAsync(Booking booking);
        ValueTask<Booking> DeleteBookingAsync(Guid bookingId);
    }
}