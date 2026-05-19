using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Payments;

namespace Mulkchi.Api.Application.Bookings.ConfirmPayment;

public sealed class ConfirmBookingPaymentResult
{
    public Guid BookingId { get; init; }
    public Guid PaymentId { get; init; }
    public BookingStatus BookingStatus { get; init; }
    public PaymentStatus PaymentStatus { get; init; }
}
