using FluentValidation;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Validators;

public class PropertyCreateDtoValidator : AbstractValidator<PropertyCreateDto>
{
    public PropertyCreateDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Sarlavha kiritilishi shart")
            .MinimumLength(5).WithMessage("Sarlavha kamida 5 ta belgidan iborat bo'lishi kerak")
            .MaximumLength(200).WithMessage("Sarlavha 200 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Tavsif kiritilishi shart")
            .MinimumLength(20).WithMessage("Tavsif kamida 20 ta belgidan iborat bo'lishi kerak")
            .MaximumLength(5000).WithMessage("Tavsif 5000 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Noto'g'ri mulk turi");

        RuleFor(x => x.ListingType)
            .IsInEnum().WithMessage("Noto'g'ri e'lon turi");

        RuleFor(x => x.Area)
            .GreaterThan(0).WithMessage("Maydon 0 dan katta bo'lishi kerak")
            .LessThanOrEqualTo(10000).WithMessage("Maydon juda katta");

        RuleFor(x => x.NumberOfBedrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Xonalar soni manfiy bo'lishi mumkin emas")
            .LessThanOrEqualTo(50).WithMessage("Xonalar soni juda ko'p");

        RuleFor(x => x.NumberOfBathrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Hammomlar soni manfiy bo'lishi mumkin emas")
            .LessThanOrEqualTo(20).WithMessage("Hammomlar soni juda ko'p");

        RuleFor(x => x.MaxGuests)
            .GreaterThan(0).WithMessage("Mehmonlar soni 0 dan katta bo'lishi kerak")
            .LessThanOrEqualTo(100).WithMessage("Mehmonlar soni juda ko'p");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Shahar kiritilishi shart")
            .MaximumLength(100).WithMessage("Shahar nomi 100 ta belgidan oshmasligi kerak");

        RuleFor(x => x.District)
            .NotEmpty().WithMessage("Tuman kiritilishi shart")
            .MaximumLength(100).WithMessage("Tuman nomi 100 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Manzil kiritilishi shart")
            .MaximumLength(500).WithMessage("Manzil 500 ta belgidan oshmasligi kerak");

        // Price validation based on listing type
        When(x => x.ListingType == ListingType.Sale, () =>
        {
            RuleFor(x => x.SalePrice)
                .NotNull().WithMessage("Sotish narxi kiritilishi shart")
                .GreaterThan(0).WithMessage("Narx 0 dan katta bo'lishi kerak");
        });

        When(x => x.ListingType == ListingType.Rent, () =>
        {
            RuleFor(x => x.MonthlyRent)
                .NotNull().WithMessage("Oylik ijara narxi kiritilishi shart")
                .GreaterThan(0).WithMessage("Narx 0 dan katta bo'lishi kerak");
        });

        When(x => x.ListingType == ListingType.ShortTermRent, () =>
        {
            RuleFor(x => x.PricePerNight)
                .NotNull().WithMessage("Kunlik ijara narxi kiritilishi shart")
                .GreaterThan(0).WithMessage("Narx 0 dan katta bo'lishi kerak");
        });

        // Location validation (optional but must be valid if provided)
        When(x => x.Latitude != 0, () =>
        {
            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90).WithMessage("Kenglik -90 va 90 orasida bo'lishi kerak");
        });

        When(x => x.Longitude != 0, () =>
        {
            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180).WithMessage("Uzunlik -180 va 180 orasida bo'lishi kerak");
        });
    }
}
