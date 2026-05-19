using FluentValidation;
using Mulkchi.Api.Models.Foundations.Bookings;

namespace Mulkchi.Api.Validators;

public class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingRequestValidator()
    {
        RuleFor(x => x.PropertyId)
            .NotEmpty().WithMessage("Mulk ID kiritilishi shart");

        RuleFor(x => x.CheckInDate)
            .NotEmpty().WithMessage("Kirish sanasi kiritilishi shart")
            .Must(BeInFuture).WithMessage("Kirish sanasi kelajakda bo'lishi kerak");

        RuleFor(x => x.CheckOutDate)
            .NotEmpty().WithMessage("Chiqish sanasi kiritilishi shart");

        RuleFor(x => x)
            .Must(HaveValidDateRange)
            .WithMessage("Chiqish sanasi kirish sanasidan keyin bo'lishi kerak");

        RuleFor(x => x.NumberOfGuests)
            .GreaterThan(0).WithMessage("Mehmonlar soni 0 dan katta bo'lishi kerak")
            .LessThanOrEqualTo(50).WithMessage("Mehmonlar soni juda ko'p");

        When(x => !string.IsNullOrEmpty(x.Notes), () =>
        {
            RuleFor(x => x.Notes)
                .MaximumLength(1000).WithMessage("Eslatmalar 1000 ta belgidan oshmasligi kerak");
        });
    }

    private bool BeInFuture(DateTimeOffset date)
    {
        return date.Date >= DateTime.UtcNow.Date;
    }

    private bool HaveValidDateRange(CreateBookingRequest booking)
    {
        return booking.CheckOutDate > booking.CheckInDate;
    }
}
