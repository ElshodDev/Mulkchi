#nullable disable

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Bookings;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<BookingHold> BookingHolds { get; set; }

    public async ValueTask<BookingHold> InsertBookingHoldAsync(BookingHold hold)
    {
        var entry = await this.BookingHolds.AddAsync(hold);
        await this.SaveChangesAsync();
        return entry.Entity;
    }

    /// <summary>Returns active (non-expired) holds for a property.</summary>
    public IQueryable<BookingHold> SelectActiveBookingHolds(Guid propertyId)
        => this.BookingHolds
               .Where(h => h.PropertyId == propertyId && h.ExpiresAt > DateTimeOffset.UtcNow);

    public async ValueTask<BookingHold> SelectBookingHoldByIdAsync(Guid holdId)
        => await this.BookingHolds.FindAsync(holdId);

    public async ValueTask DeleteBookingHoldAsync(Guid holdId)
    {
        var hold = await this.BookingHolds.FindAsync(holdId);
        if (hold != null)
        {
            this.BookingHolds.Remove(hold);
            await this.SaveChangesAsync();
        }
    }

    public async ValueTask DeleteExpiredBookingHoldsAsync()
    {
        var expired = this.BookingHolds
            .Where(h => h.ExpiresAt <= DateTimeOffset.UtcNow);

        this.BookingHolds.RemoveRange(expired);
        await this.SaveChangesAsync();
    }
}
