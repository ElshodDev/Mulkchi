using FluentValidation;

namespace Mulkchi.Api.Application.Bookings.CreateHold;

public sealed class CreateBookingHoldCommandValidator : AbstractValidator<CreateBookingHoldCommand>
{
    public CreateBookingHoldCommandValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
        RuleFor(x => x.CheckInDate).LessThan(x => x.CheckOutDate);
        RuleFor(x => x.CheckInDate)
            .Must(x => x > DateTimeOffset.UtcNow)
            .WithMessage("Check-in date must be in the future.");
    }
}
