using FluentValidation;

namespace Mulkchi.Api.Application.Bookings.ConfirmPayment;

public sealed class ConfirmBookingPaymentCommandValidator : AbstractValidator<ConfirmBookingPaymentCommand>
{
    public ConfirmBookingPaymentCommandValidator()
    {
        RuleFor(x => x.HoldId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.IdempotencyKey).NotEmpty();
        RuleFor(x => x.IdempotencyKey)
            .MaximumLength(128);
    }
}
