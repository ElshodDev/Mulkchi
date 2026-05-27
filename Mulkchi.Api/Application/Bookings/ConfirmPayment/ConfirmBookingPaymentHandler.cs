using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Text.Json;
using Mulkchi.Api.Application.Bookings.Common;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Outbox;
using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Application.Bookings.ConfirmPayment;

public interface IConfirmBookingPaymentHandler
{
    ValueTask<ConfirmBookingPaymentResult> HandleAsync(ConfirmBookingPaymentCommand command);
}

public sealed class ConfirmBookingPaymentHandler : IConfirmBookingPaymentHandler
{
    private readonly IValidator<ConfirmBookingPaymentCommand> validator;
    private readonly StorageBroker storageBroker;
    private readonly ICurrentUserService currentUserService;

    public ConfirmBookingPaymentHandler(
        IValidator<ConfirmBookingPaymentCommand> validator,
        StorageBroker storageBroker,
        ICurrentUserService currentUserService)
    {
        this.validator = validator;
        this.storageBroker = storageBroker;
        this.currentUserService = currentUserService;
    }

    public async ValueTask<ConfirmBookingPaymentResult> HandleAsync(ConfirmBookingPaymentCommand command)
    {
        await this.validator.ValidateAndThrowAsync(command);

        Guid? currentUserId = this.currentUserService.GetCurrentUserId();
        if (!currentUserId.HasValue)
            throw new UnauthorizedAccessException("Current user is missing.");

        if (!string.IsNullOrWhiteSpace(command.IdempotencyKey))
        {
            Payment? existingPayment =
                await this.storageBroker.SelectPaymentByIdempotencyKeyAsync(command.IdempotencyKey);

            if (existingPayment is not null && existingPayment.BookingId.HasValue)
            {
                Booking? existingBooking = await this.storageBroker.SelectBookingByIdAsync(existingPayment.BookingId.Value);
                if (existingBooking is not null)
                {
                    return new ConfirmBookingPaymentResult
                    {
                        BookingId = existingBooking.Id,
                        PaymentId = existingPayment.Id,
                        BookingStatus = existingBooking.Status,
                        PaymentStatus = existingPayment.Status
                    };
                }
            }
        }

        BookingHold? hold = await this.storageBroker.SelectBookingHoldByIdAsync(command.HoldId);
        if (hold is null || hold.ExpiresAt <= DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Hold is missing or expired.");

        if (hold.UserId != currentUserId.Value && !this.currentUserService.IsInRole("Admin"))
            throw new UnauthorizedAccessException("You cannot confirm another user's hold.");

        var property = await this.storageBroker.SelectPropertyByIdAsync(hold.PropertyId)
            ?? throw new InvalidOperationException("Property not found.");

        await using var transaction = await this.storageBroker.Database
            .BeginTransactionAsync(IsolationLevel.Serializable);

        try
        {
            hold = await this.storageBroker.SelectBookingHoldByIdAsync(command.HoldId);
            if (hold is null || hold.ExpiresAt <= DateTimeOffset.UtcNow)
                throw new InvalidOperationException("Hold is missing or expired.");

            bool bookingConflict = await this.storageBroker.SelectAllBookings().AnyAsync(booking =>
                BookingOverlapPolicy.ConflictsWithBooking(
                    booking,
                    hold.PropertyId,
                    hold.CheckInDate,
                    hold.CheckOutDate));

            if (bookingConflict)
                throw new InvalidOperationException("Dates are already reserved.");

            DateTimeOffset now = DateTimeOffset.UtcNow;
            var booking = await this.storageBroker.InsertBookingAsync(new Booking
            {
                Id = Guid.NewGuid(),
                PropertyId = hold.PropertyId,
                GuestId = hold.UserId,
                CheckInDate = hold.CheckInDate,
                CheckOutDate = hold.CheckOutDate,
                NumberOfGuests = 1,
                TotalPrice = command.Amount,
                Status = BookingStatus.Pending,
                CreatedDate = now,
                UpdatedDate = now
            });

            Payment payment = await this.storageBroker.InsertPaymentAsync(new Payment
            {
                Id = Guid.NewGuid(),
                Amount = command.Amount,
                PlatformFee = Math.Round(command.Amount * 0.05m, 2),
                HostReceives = Math.Round(command.Amount * 0.95m, 2),
                Type = PaymentType.BookingPayment,
                Status = PaymentStatus.Pending,
                Method = command.Method,
                IsEscrowHeld = true,
                PayerId = hold.UserId,
                ReceiverId = property.HostId,
                BookingId = booking.Id,
                IdempotencyKey = command.IdempotencyKey,
                CreatedDate = now,
                UpdatedDate = now
            });

            await this.storageBroker.OutboxMessages.AddAsync(new OutboxMessage
            {
                Id = Guid.NewGuid(),
                Type = "booking.pending-payment-created",
                Payload = JsonSerializer.Serialize(new
                {
                    bookingId = booking.Id,
                    paymentId = payment.Id,
                    guestId = booking.GuestId
                }),
                CreatedDate = now
            });

            await this.storageBroker.DeleteBookingHoldAsync(hold.Id);
            await this.storageBroker.SaveChangesAsync();
            await transaction.CommitAsync();

            return new ConfirmBookingPaymentResult
            {
                BookingId = booking.Id,
                PaymentId = payment.Id,
                BookingStatus = booking.Status,
                PaymentStatus = payment.Status
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
