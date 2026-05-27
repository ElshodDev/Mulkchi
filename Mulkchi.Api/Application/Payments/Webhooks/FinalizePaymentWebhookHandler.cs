using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Outbox;
using Mulkchi.Api.Models.Foundations.Payments;
using System.Text.Json;

namespace Mulkchi.Api.Application.Payments.Webhooks;

public interface IFinalizePaymentWebhookHandler
{
    ValueTask<Payment?> HandleAsync(FinalizePaymentWebhookCommand command);
}

public sealed class FinalizePaymentWebhookHandler : IFinalizePaymentWebhookHandler
{
    private readonly StorageBroker storageBroker;

    public FinalizePaymentWebhookHandler(StorageBroker storageBroker)
    {
        this.storageBroker = storageBroker;
    }

    public async ValueTask<Payment?> HandleAsync(FinalizePaymentWebhookCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.ExternalTransactionId))
            throw new ArgumentException("External transaction id is required.", nameof(command.ExternalTransactionId));

        await using var tx = await this.storageBroker.Database.BeginTransactionAsync();

        try
        {
            Payment? payment = await this.storageBroker.SelectAllPayments()
                .FirstOrDefaultAsync(p =>
                    p.ExternalTransactionId == command.ExternalTransactionId &&
                    p.Method == command.Method);

            if (payment is null)
                return null;

            if (payment.Status == command.TargetStatus)
                return payment;

            payment.Status = command.TargetStatus;
            payment.UpdatedDate = DateTimeOffset.UtcNow;

            if (command.TargetStatus == PaymentStatus.Completed)
            {
                payment.IsEscrowHeld = false;
                payment.EscrowReleasedAt = DateTimeOffset.UtcNow;
            }

            await this.storageBroker.UpdatePaymentAsync(payment);

            if (payment.BookingId.HasValue)
            {
                Booking booking = await this.storageBroker.SelectBookingByIdAsync(payment.BookingId.Value);
                if (booking is not null)
                {
                    if (command.TargetStatus == PaymentStatus.Completed &&
                        booking.Status == BookingStatus.Pending)
                    {
                        booking.Status = BookingStatus.Confirmed;
                        booking.UpdatedDate = DateTimeOffset.UtcNow;
                        await this.storageBroker.UpdateBookingAsync(booking);
                    }
                    else if (command.TargetStatus == PaymentStatus.Cancelled)
                    {
                        booking.Status = BookingStatus.Cancelled;
                        booking.UpdatedDate = DateTimeOffset.UtcNow;
                        await this.storageBroker.UpdateBookingAsync(booking);
                    }
                }
            }

            await this.storageBroker.OutboxMessages.AddAsync(new OutboxMessage
            {
                Id = Guid.NewGuid(),
                Type = "payment.webhook-finalized",
                Payload = JsonSerializer.Serialize(new
                {
                    paymentId = payment.Id,
                    externalTransactionId = payment.ExternalTransactionId,
                    status = payment.Status.ToString()
                }),
                CreatedDate = DateTimeOffset.UtcNow
            });

            await this.storageBroker.SaveChangesAsync();

            await tx.CommitAsync();
            return payment;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
