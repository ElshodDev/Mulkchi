#nullable disable

using System;
using System.Linq;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Bookings;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Brokers.Storages
{
    public partial class StorageBroker
    {
        public DbSet<Booking> Bookings { get; set; }

        public async ValueTask<Booking> InsertBookingAsync(Booking booking)
        {
            var entry = await this.Bookings.AddAsync(booking);
            await this.SaveChangesAsync();
            return entry.Entity;
        }

        public IQueryable<Booking> SelectAllBookings() =>
            this.Bookings.Include(b => b.Property).AsQueryable();

        public async ValueTask<Booking> SelectBookingByIdAsync(Guid bookingId)
            => (await this.Bookings.FindAsync(bookingId))!;

        public async ValueTask<Booking> UpdateBookingAsync(Booking booking)
        {
            this.Entry(booking).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return booking;
        }

        public async ValueTask<Booking> DeleteBookingAsync(Guid bookingId)
        {
            Booking booking = await this.Bookings.FindAsync(bookingId);
            if (booking is null)
                return null!;

            booking.DeletedDate = DateTimeOffset.UtcNow;
            booking.UpdatedDate = DateTimeOffset.UtcNow;
            this.Entry(booking).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return booking;
        }
    }
}