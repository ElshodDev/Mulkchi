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
using System.Collections.Concurrent;
using Mulkchi.Api.Models.Foundations.Bookings.Exceptions;

namespace Mulkchi.Api.Services.Foundations.Bookings
{
    public partial class BookingService : IBookingService
    {
        private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> propertyLocks = new();
        private readonly IStorageBroker storageBroker;
        private readonly ICurrentUserService currentUserService;
        private readonly IEmailBroker emailBroker;
        private readonly ILogger<BookingService> logger;

        public BookingService(
            IStorageBroker storageBroker,
            ICurrentUserService currentUserService,
            IEmailBroker emailBroker,
            ILogger<BookingService> logger)
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
                throw new UnauthorizedAccessException("Current user is missing.");

            var property = await this.storageBroker.SelectPropertyByIdAsync(dto.PropertyId);
            if (property == null)
                throw new ArgumentException("Property not found.");

            var propertyLock = propertyLocks.GetOrAdd(dto.PropertyId, _ => new SemaphoreSlim(1, 1));
            await propertyLock.WaitAsync();

            try
            {
                var holdConflict = await this.storageBroker
                    .SelectActiveBookingHolds(dto.PropertyId)
                    .FirstOrDefaultAsync(h =>
                        h.CheckInDate < dto.CheckOutDate &&
                        h.CheckOutDate > dto.CheckInDate &&
                        h.UserId != currentUserId.Value);

                if (holdConflict != null)
                    throw new InvalidOperationException("Ushbu sana boshqa foydalanuvchi tomonidan vaqtincha band qilingan.");

                bool bookingConflict = await this.storageBroker.SelectAllBookings()
                    .AnyAsync(b =>
                        b.PropertyId == dto.PropertyId &&
                        b.Status != BookingStatus.Cancelled &&
                        b.CheckInDate < dto.CheckOutDate &&
                        b.CheckOutDate > dto.CheckInDate);

                if (bookingConflict)
                    throw new InvalidOperationException("Tanlangan sanalar allaqachon band.");

                decimal totalPrice = CalculateTotalPrice(property, dto.CheckInDate, dto.CheckOutDate);
                var now = DateTimeOffset.UtcNow;

                var booking = new Booking
                {
                    Id = Guid.NewGuid(),
                    PropertyId = dto.PropertyId,
                    GuestId = currentUserId.Value,
                    CheckInDate = dto.CheckInDate,
                    CheckOutDate = dto.CheckOutDate,
                    TotalPrice = totalPrice,
                    CreatedDate = now,
                    UpdatedDate = now,
                    Status = property.IsInstantBook ? BookingStatus.Confirmed : BookingStatus.Pending
                };

                ValidateBookingOnAdd(booking);
                var addedBooking = await this.storageBroker.InsertBookingAsync(booking);

                await SendBookingConfirmationToGuestAsync(addedBooking, property);
                await SendNewBookingAlertToHostAsync(addedBooking, property);

                return ToBookingResponse(addedBooking);
            }
            finally
            {
                propertyLock.Release();
            }
        }

        public ValueTask<Booking> AddBookingAsync(Booking booking) =>
            TryCatch(async () =>
            {
                ValidateBookingOnAdd(booking);

                var property = await this.storageBroker.SelectPropertyByIdAsync(booking.PropertyId);
                if (property == null)
                    throw new ArgumentException("Property not found.");

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
                throw new UnauthorizedAccessException("Unauthorized.");

            IQueryable<Booking> query = this.storageBroker.SelectAllBookings()
                .Include(b => b.Guest)
                .Include(b => b.Property)
                    .ThenInclude(p => p.Images);

            if (queryParams.IsHostView)
                query = query.Where(b => b.Property.HostId == currentUserId.Value);
            else if (queryParams.UserId.HasValue)
                query = query.Where(b => b.GuestId == queryParams.UserId.Value);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(b => b.CreatedDate)
                .Skip((queryParams.Page - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return (items.Select(ToBookingResponse).ToList(), totalCount);
        }

        public async ValueTask<BookingResponse> RetrieveBookingByIdAsync(Guid bookingId)
        {
            ValidateBookingId(bookingId);
            Booking booking = await this.storageBroker.SelectBookingByIdAsync(bookingId);
            ValidateStorageBooking(booking, bookingId);

            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") &&
                booking.GuestId != currentUserId.Value && booking.Property.HostId != currentUserId.Value))
                throw new UnauthorizedAccessException("You can only access your own bookings.");

            return ToBookingResponse(booking);
        }

        public IQueryable<Booking> RetrieveAllBookings() =>
            TryCatch(() => this.storageBroker.SelectAllBookings());


        public async ValueTask<BookingResponse> ConfirmBookingAsync(Guid bookingId)
        {
            ValidateBookingId(bookingId);
            Booking booking = await this.storageBroker.SelectBookingByIdAsync(bookingId);
            ValidateStorageBooking(booking, bookingId);

            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && booking.Property.HostId != currentUserId.Value))
                throw new UnauthorizedAccessException("You can only confirm bookings on your own properties.");

            if (booking.Status != BookingStatus.Pending)
                throw new InvalidOperationException("Only pending bookings can be confirmed.");

            booking.Status = BookingStatus.Confirmed;
            booking.UpdatedDate = DateTimeOffset.UtcNow;

            var updatedBooking = await this.storageBroker.UpdateBookingAsync(booking);
            await SendBookingStatusChangeNotificationAsync(updatedBooking, "confirmed");

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
                throw new UnauthorizedAccessException("You can only cancel your own bookings.");

            booking.Status = BookingStatus.Cancelled;
            booking.UpdatedDate = DateTimeOffset.UtcNow;

            var updatedBooking = await this.storageBroker.UpdateBookingAsync(booking);
            await SendBookingStatusChangeNotificationAsync(updatedBooking, "cancelled");

            return ToBookingResponse(updatedBooking);
        }


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


        private static readonly TimeSpan HoldDuration = TimeSpan.FromMinutes(10);

        public async ValueTask<BookingHold> CreateBookingHoldAsync(
            Guid propertyId,
            DateTimeOffset checkIn,
            DateTimeOffset checkOut)
        {
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue)
                throw new UnauthorizedAccessException("Foydalanuvchi aniqlanmadi.");

            var propertyLock = propertyLocks.GetOrAdd(propertyId, _ => new SemaphoreSlim(1, 1));
            await propertyLock.WaitAsync();

            try
            {
                await this.storageBroker.DeleteExpiredBookingHoldsAsync();

                bool holdConflict = await this.storageBroker
                    .SelectActiveBookingHolds(propertyId)
                    .AnyAsync(h =>
                        h.CheckInDate < checkOut &&
                        h.CheckOutDate > checkIn &&
                        h.UserId != currentUserId.Value);

                if (holdConflict)
                    throw new InvalidOperationException("Ushbu sana boshqa foydalanuvchi tomonidan vaqtincha band qilingan. Iltimos 10 daqiqadan keyin urinib ko'ring.");

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
            finally
            {
                propertyLock.Release();
            }
        }

        public async ValueTask ReleaseBookingHoldAsync(Guid holdId)
        {
            var currentUserId = this.currentUserService.GetCurrentUserId();
            var hold = await this.storageBroker.SelectBookingHoldByIdAsync(holdId);

            if (hold is null) return;

            if (currentUserId.HasValue && hold.UserId != currentUserId.Value &&
                !this.currentUserService.IsInRole("Admin"))
                throw new UnauthorizedAccessException("Bu hold sizga tegishli emas.");

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


        private static decimal CalculateTotalPrice(
            Models.Foundations.Properties.Property property,
            DateTimeOffset checkIn,
            DateTimeOffset checkOut)
        {
            var nights = (int)Math.Ceiling((checkOut - checkIn).TotalDays);
            if (nights < 1) nights = 1;

            return property.ListingType switch
            {
                Models.Foundations.Properties.ListingType.ShortTermRent =>
                    Math.Round((property.PricePerNight ?? 0) * nights * 1.1m, 0),
                Models.Foundations.Properties.ListingType.Rent =>
                    property.MonthlyRent ?? 0,
                _ => property.SalePrice ?? 0
            };
        }


        private static BookingResponse ToBookingResponse(Booking b) => new()
        {
            Id = b.Id,
            PropertyId = b.PropertyId,
            GuestId = b.GuestId,
            CheckInDate = b.CheckInDate,
            CheckOutDate = b.CheckOutDate,
            NumberOfGuests = b.NumberOfGuests,
            TotalPrice = b.TotalPrice,
            Status = b.Status,
            Notes = b.Notes,
            CreatedDate = b.CreatedDate,
            UpdatedDate = b.UpdatedDate,
            Property = b.Property != null ? new PropertySummaryResponse
            {
                Id = b.Property.Id,
                Title = b.Property.Title,
                MainImageUrl = b.Property.Images?.FirstOrDefault(i => i.IsPrimary)?.Url,
                City = b.Property.City,
                District = b.Property.District
            } : null,
            Guest = b.Guest != null ? new GuestSummaryResponse
            {
                Id = b.Guest.Id,
                FirstName = b.Guest.FirstName,
                LastName = b.Guest.LastName,
                AvatarUrl = b.Guest.AvatarUrl,
                Phone = b.Guest.Phone
            } : null
        };


        private async Task SendBookingConfirmationToGuestAsync(
            Booking booking,
            Models.Foundations.Properties.Property property)
        {
            try
            {
                await this.storageBroker.InsertNotificationAsync(new Models.Foundations.Notifications.Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = booking.GuestId,
                    Type = Models.Foundations.Notifications.NotificationType.BookingRequest,
                    TitleUz = booking.Status == BookingStatus.Confirmed
                        ? "Broningiz tasdiqlandi! ✅"
                        : "Broningiz qabul qilindi ⏳",
                    TitleRu = booking.Status == BookingStatus.Confirmed
                        ? "Бронирование подтверждено! ✅"
                        : "Бронирование принято ⏳",
                    TitleEn = booking.Status == BookingStatus.Confirmed
                        ? "Booking Confirmed! ✅"
                        : "Booking Received ⏳",
                    BodyUz = $"'{property.Title}' — {booking.CheckInDate:dd.MM.yyyy} dan {booking.CheckOutDate:dd.MM.yyyy} gacha. Jami: {booking.TotalPrice:N0} UZS",
                    BodyRu = $"'{property.Title}' — {booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy}. Итого: {booking.TotalPrice:N0} UZS",
                    BodyEn = $"'{property.Title}' — {booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy}. Total: {booking.TotalPrice:N0} UZS",
                    ActionUrl = $"/bookings/{booking.Id}",
                    IsRead = false,
                    CreatedDate = DateTimeOffset.UtcNow,
                    UpdatedDate = DateTimeOffset.UtcNow
                });

                var guest = await this.storageBroker.SelectUserByIdAsync(booking.GuestId);
                if (guest?.Email != null)
                {
                    string statusText = booking.Status == BookingStatus.Confirmed
                        ? "✅ Avtomatik tasdiqlandi"
                        : "⏳ Uy egasi tasdiqini kutmoqda";

                    await this.emailBroker.SendEmailAsync(
                        guest.Email,
                        $"Bron tasdiqlandi — {property.Title}",
                        $"Salom, {guest.FirstName}!\n\n" +
                        $"Sizning broningiz:\n" +
                        $"🏠 Mulk: {property.Title}\n" +
                        $"📍 Manzil: {property.Address}, {property.City}\n" +
                        $"📅 Kirish: {booking.CheckInDate:dd.MM.yyyy}\n" +
                        $"📅 Chiqish: {booking.CheckOutDate:dd.MM.yyyy}\n" +
                        $"💰 Jami summa: {booking.TotalPrice:N0} UZS\n" +
                        $"📌 Holat: {statusText}\n\n" +
                        $"Bron tafsiloti: https://mulkchi.uz/bookings/{booking.Id}\n\n" +
                        $"Hurmat bilan,\nMulkchi.uz jamoasi");
                }
            }
            catch (Exception ex)
            {
                this.logger.LogWarning(ex, "Guest bildirishnomasi yuborishda xatolik. BookingId={BookingId}", booking.Id);
            }
        }

        private async Task SendNewBookingAlertToHostAsync(
            Booking booking,
            Models.Foundations.Properties.Property property)
        {
            try
            {
                await this.storageBroker.InsertNotificationAsync(new Models.Foundations.Notifications.Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = property.HostId,
                    Type = Models.Foundations.Notifications.NotificationType.BookingRequest,
                    TitleUz = "Yangi bron so'rovi! 🏠",
                    TitleRu = "Новый запрос на бронирование! 🏠",
                    TitleEn = "New booking request! 🏠",
                    BodyUz = $"'{property.Title}': {booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy}. Jami: {booking.TotalPrice:N0} UZS",
                    BodyRu = $"'{property.Title}': {booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy}. Итого: {booking.TotalPrice:N0} UZS",
                    BodyEn = $"'{property.Title}': {booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy}. Total: {booking.TotalPrice:N0} UZS",
                    ActionUrl = $"/host/bookings/{booking.Id}",
                    IsRead = false,
                    CreatedDate = DateTimeOffset.UtcNow,
                    UpdatedDate = DateTimeOffset.UtcNow
                });

                var host = await this.storageBroker.SelectUserByIdAsync(property.HostId);
                if (host?.Email != null)
                {
                    var guest = await this.storageBroker.SelectUserByIdAsync(booking.GuestId);
                    string guestName = guest != null ? $"{guest.FirstName} {guest.LastName}" : "Mehmon";

                    await this.emailBroker.SendEmailAsync(
                        host.Email,
                        $"Yangi bron so'rovi — {property.Title}",
                        $"Salom, {host.FirstName}!\n\n" +
                        $"'{property.Title}' mulkingizga yangi bron:\n" +
                        $"👤 Mehmon: {guestName}\n" +
                        $"📅 Kirish: {booking.CheckInDate:dd.MM.yyyy}\n" +
                        $"📅 Chiqish: {booking.CheckOutDate:dd.MM.yyyy}\n" +
                        $"💰 Jami summa: {booking.TotalPrice:N0} UZS\n" +
                        $"📌 Holat: {(booking.Status == BookingStatus.Confirmed ? "✅ Avtomatik tasdiqlandi" : "⏳ Tasdiqingizni kutmoqda")}\n\n" +
                        $"Bronni boshqarish: https://mulkchi.uz/host/bookings/{booking.Id}\n\n" +
                        $"Hurmat bilan,\nMulkchi.uz jamoasi");
                }
            }
            catch (Exception ex)
            {
                this.logger.LogWarning(ex, "Host bildirishnomasi yuborishda xatolik. BookingId={BookingId}", booking.Id);
            }
        }

        private async Task SendBookingStatusChangeNotificationAsync(Booking booking, string action)
        {
            try
            {
                bool isConfirmed = action == "confirmed";

                await this.storageBroker.InsertNotificationAsync(new Models.Foundations.Notifications.Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = booking.GuestId,
                    Type = isConfirmed
                        ? Models.Foundations.Notifications.NotificationType.BookingApproved
                        : Models.Foundations.Notifications.NotificationType.BookingRejected,
                    TitleUz = isConfirmed ? "Broningiz tasdiqlandi! ✅" : "Bron bekor qilindi ❌",
                    TitleRu = isConfirmed ? "Бронирование подтверждено! ✅" : "Бронирование отменено ❌",
                    TitleEn = isConfirmed ? "Booking Confirmed! ✅" : "Booking Cancelled ❌",
                    BodyUz = isConfirmed
                        ? $"Broningiz tasdiqlandi. {booking.CheckInDate:dd.MM.yyyy} kuni xush kelibsiz!"
                        : $"{booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy} uchun broniz bekor qilindi.",
                    BodyRu = isConfirmed
                        ? $"Ваше бронирование подтверждено. Добро пожаловать {booking.CheckInDate:dd.MM.yyyy}!"
                        : $"Бронирование на {booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy} отменено.",
                    BodyEn = isConfirmed
                        ? $"Your booking is confirmed. Welcome on {booking.CheckInDate:dd.MM.yyyy}!"
                        : $"Booking for {booking.CheckInDate:dd.MM.yyyy} – {booking.CheckOutDate:dd.MM.yyyy} has been cancelled.",
                    ActionUrl = $"/bookings/{booking.Id}",
                    IsRead = false,
                    UpdatedDate = DateTimeOffset.UtcNow
                });

                if (!isConfirmed && booking.Property != null)
                {
                    await this.storageBroker.InsertNotificationAsync(new Models.Foundations.Notifications.Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = booking.Property.HostId,
                        Type = Models.Foundations.Notifications.NotificationType.BookingRejected,
                        TitleUz = "Bron bekor qilindi ❌",
                        TitleRu = "Бронирование отменено ❌",
                        TitleEn = "Booking Cancelled ❌",
                        BodyUz = $"Sizning '{booking.Property.Title}' mulkingizdagi bron ({booking.CheckInDate:dd.MM.yyyy} - {booking.CheckOutDate:dd.MM.yyyy}) bekor qilindi.",
                        BodyRu = $"Бронирование для '{booking.Property.Title}' ({booking.CheckInDate:dd.MM.yyyy} - {booking.CheckOutDate:dd.MM.yyyy}) отменено.",
                        BodyEn = $"Booking for '{booking.Property.Title}' ({booking.CheckInDate:dd.MM.yyyy} - {booking.CheckOutDate:dd.MM.yyyy}) has been cancelled.",
                        ActionUrl = $"/properties/{booking.PropertyId}",
                        IsRead = false,
                        CreatedDate = DateTimeOffset.UtcNow,
                        UpdatedDate = DateTimeOffset.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                this.logger.LogWarning(ex, "Status change bildirishnomasi yuborishda xatolik. BookingId={BookingId}", booking.Id);
            }
        }
    }
}
