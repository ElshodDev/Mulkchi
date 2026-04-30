using FluentValidation;
using Mulkchi.Api.Application.DTOs;

namespace Mulkchi.Api.Application.Validators;

/// <summary>
/// CreatePropertyRequest validatsiyasi
/// BMI: Clean Architecture - Application Layer Validation
/// </summary>
public class CreatePropertyRequestValidator : AbstractValidator<CreatePropertyRequest>
{
    public CreatePropertyRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Sarlavha majburiy")
            .MinimumLength(10).WithMessage("Sarlavha kamida 10 ta belgidan iborat bo'lishi kerak")
            .MaximumLength(200).WithMessage("Sarlavha 200 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Tavsif majburiy")
            .MinimumLength(50).WithMessage("Tavsif kamida 50 ta belgidan iborat bo'lishi kerak")
            .MaximumLength(5000).WithMessage("Tavsif 5000 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Narx 0 dan katta bo'lishi kerak")
            .LessThan(100_000_000).WithMessage("Narx 100 million dan oshmasligi kerak");

        RuleFor(x => x.Area)
            .GreaterThan(5).WithMessage("Maydon kamida 5 kv.m bo'lishi kerak")
            .LessThan(10000).WithMessage("Maydon 10000 kv.m dan oshmasligi kerak");

        RuleFor(x => x.Rooms)
            .GreaterThan(0).WithMessage("Xonalar soni 0 dan katta bo'lishi kerak")
            .LessThan(50).WithMessage("Xonalar soni 50 dan oshmasligi kerak");

        RuleFor(x => x.Bathrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Hammomlar soni manfiy bo'lishi mumkin emas")
            .LessThan(20).WithMessage("Hammomlar soni 20 dan oshmasligi kerak");

        RuleFor(x => x.Floor)
            .GreaterThanOrEqualTo(0).WithMessage("Qavat manfiy bo'lishi mumkin emas")
            .LessThan(100).WithMessage("Qavat 100 dan oshmasligi kerak");

        RuleFor(x => x.TotalFloors)
            .GreaterThan(0).WithMessage("Jami qavatlar soni 0 dan katta bo'lishi kerak")
            .GreaterThanOrEqualTo(x => x.Floor).WithMessage("Jami qavatlar qavatdan kichik bo'lishi mumkin emas");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Manzil majburiy")
            .MinimumLength(10).WithMessage("Manzil kamida 10 ta belgidan iborat bo'lishi kerak")
            .MaximumLength(500).WithMessage("Manzil 500 ta belgidan oshmasligi kerak");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Shahar majburiy")
            .MaximumLength(100).WithMessage("Shahar 100 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Region)
            .NotEmpty().WithMessage("Viloyat majburiy")
            .MaximumLength(100).WithMessage("Viloyat 100 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("Latitude -90 va 90 orasida bo'lishi kerak")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("Longitude -180 va 180 orasida bo'lishi kerak")
            .When(x => x.Longitude.HasValue);
    }
}
