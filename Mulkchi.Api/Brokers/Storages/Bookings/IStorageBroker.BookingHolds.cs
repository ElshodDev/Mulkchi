#nullable disable

using System;
using System.Linq;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Bookings;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<BookingHold> InsertBookingHoldAsync(BookingHold hold);
    IQueryable<BookingHold> SelectActiveBookingHolds(Guid propertyId);
    ValueTask<BookingHold> SelectBookingHoldByIdAsync(Guid holdId);
    ValueTask DeleteBookingHoldAsync(Guid holdId);
    ValueTask DeleteExpiredBookingHoldsAsync();
}
