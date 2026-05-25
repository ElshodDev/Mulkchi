#nullable disable

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Brokers.Notifications;

namespace Mulkchi.Api.Services.Foundations.Bookings
{
    public partial class BookingService : IBookingService
    {
        private readonly IStorageBroker storageBroker;
        private readonly ICurrentUserService currentUserService;
        private readonly IEmailBroker emailBroker;
        private readonly ILogger<BookingService> logger;

        public BookingService(IStorageBroker storageBroker, ICurrentUserService currentUserService, IEmailBroker emailBroker, ILogger<BookingService> logger)
        {
            this.storageBroker = storageBroker;
            this.currentUserService = currentUserService;
            this.emailBroker = emailBroker;
            this.logger = logger;
        }

        public async ValueTask<BookingResponse> AddBookingAsync(BookingCreateDto dto)
        {
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                throw new UnauthorizedAccessException("Current user is missing.");
            }

            var property = await this.storageBroker.SelectPropertyByIdAsync(dto.PropertyId);
            if (property == null)
            {
                throw new ArgumentException("Property not found.");
            }

            var now = DateTimeOffset.UtcNow;

            // Conflict check: active holds by other users
            var holdConflictEntity = await this.storageBroker
                .SelectActiveBookingHolds(dto.PropertyId)
                .FirstOrDefaultAsync(h =>
                    h.CheckInDate < dto.CheckOutDate &&
                    h.CheckOutDate > dto.CheckInDate &&
                    h.UserId != currentUserId.Value);
            bool holdConflict = holdConflictEntity != null;

            if (holdConflict)
                throw new InvalidOperationException("Ushbu sana boshqa foydalanuvchi tomonidan vaqtincha band qilingan.");

            // Conflict check: confirmed / pending bookings
            bool bookingConflict = await this.storageBroker.SelectAllBookings()
                .AnyAsync(b =>
                    b.PropertyId == dto.PropertyId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.CheckInDate < dto.CheckOutDate &&
                    b.CheckOutDate > dto.CheckInDate);

            if (bookingConflict)
                throw new InvalidOperationException("Tanlangan sanalar allaqachon band.");

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                PropertyId = dto.PropertyId,
                GuestId = currentUserId.Value,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                TotalPrice = dto.TotalPrice,
                CreatedDate = now,
                UpdatedDate = now,
                Status = property.IsInstantBook ? BookingStatus.Confirmed : BookingStatus.Pending
            };

            ValidateBookingOnAdd(booking);
            var addedBooking = await this.storageBroker.InsertBookingAsync(booking);

            // Emails...
            await SendBookingConfirmationToGuestAsync(addedBooking, property);
            await SendNewBookingAlertToHostAsync(addedBooking, property);

            return ToBookingResponse(addedBooking);
        }

        public ValueTask<Booking> AddBookingAsync(Booking booking) =>
            TryCatch(async () =>
            {
                ValidateBookingOnAdd(booking);

                var property = await this.storageBroker.SelectPropertyByIdAsync(booking.PropertyId);
                if (property == null)
                {
                    throw new ArgumentException("Property not found.");
                }

                booking.Status = property.IsInstantBook ? BookingStatus.Confirmed : BookingStatus.Pending;

                var addedBooking = await this.storageBroker.InsertBookingAsync(booking);

                await SendBookingConfirmationToGuestAsync(addedBooking, property);
                await SendNewBookingAlertToHostAsync(addedBooking, property);

                return addedBooking;
            });

        public async ValueTask<(IEnumerable<BookingResponse> Items, int TotalCount)> RetrieveBookingsAsync(BookingQueryParams queryParams)
        {
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue && !this.currentUserService.IsInRole("Admin"))
            {
                throw new UnauthorizedAccessException("Unauthorized.");
            }

            IQueryable<Booking> query = this.storageBroker.SelectAllBookings();

            if (queryParams.IsHostView)
            {
                query = query.Where(b => b.Property.HostId == currentUserId.Value);
            }
            else
            {
                // General guest bookings (unless admin is retrieving all)
                if (queryParams.UserId.HasValue)
                {
                    query = query.Where(b => b.GuestId == queryParams.UserId.Value);
                }
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((queryParams.Page - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            var responseItems = items.Select(ToBookingResponse).ToList();
            return (responseItems, totalCount);
        }

        public async ValueTask<BookingResponse> RetrieveBookingByIdAsync(Guid bookingId)
        {
            ValidateBookingId(bookingId);
            Booking booking = await this.storageBroker.SelectBookingByIdAsync(bookingId);
            ValidateStorageBooking(booking, bookingId);

            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") &&
                booking.GuestId != currentUserId.Value && booking.Property.HostId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only access your own bookings.");
            }

            return ToBookingResponse(booking);
        }

        public async ValueTask<BookingResponse> ConfirmBookingAsync(Guid bookingId)
        {
            ValidateBookingId(bookingId);
            Booking booking = await this.storageBroker.SelectBookingByIdAsync(bookingId);
            ValidateStorageBooking(booking, bookingId);

            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && booking.Property.HostId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only confirm bookings on your own properties.");
            }

            if (booking.Status != BookingStatus.Pending)
            {
                throw new InvalidOperationException("Only pending bookings can be confirmed.");
            }

            booking.Status = BookingStatus.Confirmed;
            booking.UpdatedDate = DateTimeOffset.UtcNow;

            var updatedBooking = await this.storageBroker.UpdateBookingAsync(booking);
            return ToBookingResponse(updatedBooking);
        }

        public async ValueTask<BookingResponse> CancelBookingAsync(Guid bookingId)
        {
            ValidateBookingId(bookingId);
            Booking booking = await this.storageBroker.SelectBookingByIdAsync(bookingId);
            ValidateStorageBooking(booking, bookingId);

            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") &&
                booking.GuestId != currentUserId.Value && booking.Property.HostId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only cancel your own bookings.");
            }

            booking.Status = BookingStatus.Cancelled;
            booking.UpdatedDate = DateTimeOffset.UtcNow;

            var updatedBooking = await this.storageBroker.UpdateBookingAsync(booking);
            return ToBookingResponse(updatedBooking);
        }

        // --- Backwards compatible internal methods --- //
        public IQueryable<Booking> RetrieveAllBookings() =>
            TryCatch(() => this.storageBroker.SelectAllBookings());

        public async Task<IEnumerable<DateOnly>> RetrieveBlockedDatesAsync(Guid propertyId, int year, int month)
        {
            var startOfMonth = new DateTimeOffset(year, month, 1, 0, 0, 0, TimeSpan.Zero);
            var endOfMonth = startOfMonth.AddMonths(1);

            var bookings = await this.storageBroker.SelectAllBookings()
                .Where(b =>
                    b.PropertyId == propertyId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.CheckInDate < endOfMonth &&
                    b.CheckOutDate > startOfMonth)
                .Select(b => new { b.CheckInDate, b.CheckOutDate })
                .ToListAsync();

            var blocked = new HashSet<DateOnly>();
            foreach (var b in bookings)
            {
                var current = b.CheckInDate.Date;
                var end = b.CheckOutDate.Date;
                while (current < end)
                {
                    var d = DateOnly.FromDateTime(current);
                    if (d.Year == year && d.Month == month)
                        blocked.Add(d);
                    current = current.AddDays(1);
                }
            }

            return blocked.OrderBy(d => d);
        }

        // ── Phantom-booking protection ────────────────────────────────────

        private static readonly TimeSpan HoldDuration = TimeSpan.FromMinutes(10);

        public async ValueTask<BookingHold> CreateBookingHoldAsync(
            Guid propertyId,
            DateTimeOffset checkIn,
            DateTimeOffset checkOut)
        {
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue)
                throw new UnauthorizedAccessException("Foydalanuvchi aniqlanmadi.");

            // Remove stale holds before checking conflicts
            await this.storageBroker.DeleteExpiredBookingHoldsAsync();

            // Check for overlapping active holds
            bool holdConflict = await this.storageBroker
                .SelectActiveBookingHolds(propertyId)
                .AnyAsync(h =>
                    h.CheckInDate < checkOut &&
                    h.CheckOutDate > checkIn &&
                    h.UserId != currentUserId.Value);

            if (holdConflict)
                throw new InvalidOperationException("Ushbu sana boshqa foydalanuvchi tomonidan vaqtincha band qilingan. Iltimos 10 daqiqadan keyin urinib ko'ring.");

            // Check for confirmed/pending bookings that overlap
            bool bookingConflict = await this.storageBroker.SelectAllBookings()
                .AnyAsync(b =>
                    b.PropertyId == propertyId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.CheckInDate < checkOut &&
                    b.CheckOutDate > checkIn);

            if (bookingConflict)
                throw new InvalidOperationException("Tanlangan sanalar allaqachon band.");

            var now = DateTimeOffset.UtcNow;
            var hold = new BookingHold
            {
                Id = Guid.NewGuid(),
                PropertyId = propertyId,
                UserId = currentUserId.Value,
                CheckInDate = checkIn,
                CheckOutDate = checkOut,
                ExpiresAt = now.Add(HoldDuration),
                CreatedDate = now,
            };

            return await this.storageBroker.InsertBookingHoldAsync(hold);
        }

        public async ValueTask ReleaseBookingHoldAsync(Guid holdId)
        {
            var currentUserId = this.currentUserService.GetCurrentUserId();
            var hold = await this.storageBroker.SelectBookingHoldByIdAsync(holdId);

            if (hold is null) return; // Already expired or released

            if (currentUserId.HasValue && hold.UserId != currentUserId.Value &&
                !this.currentUserService.IsInRole("Admin"))
            {
                throw new UnauthorizedAccessException("Bu hold sizga tegishli emas.");
            }

            await this.storageBroker.DeleteBookingHoldAsync(holdId);
        }

        public ValueTask<Booking> ModifyBookingAsync(Booking booking) =>
            TryCatch(async () =>
            {
                ValidateBookingOnModify(booking);
                Booking maybeBooking = await this.storageBroker.SelectBookingByIdAsync(booking.Id);
                ValidateStorageBooking(maybeBooking, booking.Id);
                return await this.storageBroker.UpdateBookingAsync(booking);
            });

        public ValueTask<Booking> RemoveBookingAsync(Guid bookingId) =>
            TryCatch(async () =>
            {
                ValidateBookingId(bookingId);
                Booking maybeBooking = await this.storageBroker.SelectBookingByIdAsync(bookingId);
                ValidateStorageBooking(maybeBooking, bookingId);
                return await this.storageBroker.DeleteBookingAsync(bookingId);
            });

        // Mapping function internally used
        private static BookingResponse ToBookingResponse(Booking b)
        {
            return new BookingResponse
            {
                Id = b.Id,
                PropertyId = b.PropertyId,
                GuestId = b.GuestId,
                CheckInDate = b.CheckInDate,
                CheckOutDate = b.CheckOutDate,
                TotalPrice = b.TotalPrice,
                Status = b.Status,
                CreatedDate = b.CreatedDate,
                UpdatedDate = b.UpdatedDate
            };
        }

        private Task SendBookingConfirmationToGuestAsync(Booking booking, Models.Foundations.Properties.Property property) =>
            Task.CompletedTask;

        private Task SendNewBookingAlertToHostAsync(Booking booking, Models.Foundations.Properties.Property property) =>
            Task.CompletedTask;
    }
}
