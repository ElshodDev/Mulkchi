using Mulkchi.Api.Models.Foundations.Payments;

namespace Mulkchi.Api.Application.Bookings.ConfirmPayment;

public sealed record ConfirmBookingPaymentCommand(
    Guid HoldId,
    decimal Amount,
    PaymentMethod Method,
    string? IdempotencyKey);
