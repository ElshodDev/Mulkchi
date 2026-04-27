using Mulkchi.Api.Models.Foundations.Payments;

namespace Mulkchi.Api.Application.Bookings.Contracts;

public sealed class ConfirmBookingPaymentHttpRequest
{
    public Guid HoldId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
}
