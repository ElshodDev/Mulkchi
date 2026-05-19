using FluentValidation;
using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Ism kiritilishi shart")
            .MaximumLength(50).WithMessage("Ism 50 ta belgidan oshmasligi kerak");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Familiya kiritilishi shart")
            .MaximumLength(50).WithMessage("Familiya 50 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email kiritilishi shart")
            .EmailAddress().WithMessage("Email formati noto'g'ri")
            .MaximumLength(100).WithMessage("Email 100 ta belgidan oshmasligi kerak");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Telefon raqam kiritilishi shart")
            .Matches(@"^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$")
            .WithMessage("Telefon raqam formati noto'g'ri");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parol kiritilishi shart")
            .MinimumLength(8).WithMessage("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
            .Matches(@"[A-Z]").WithMessage("Parolda kamida bitta katta harf bo'lishi kerak")
            .Matches(@"[a-z]").WithMessage("Parolda kamida bitta kichik harf bo'lishi kerak")
            .Matches(@"[0-9]").WithMessage("Parolda kamida bitta raqam bo'lishi kerak")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Parolda kamida bitta maxsus belgi bo'lishi kerak");

        RuleFor(x => x.PreferredLanguage)
            .MaximumLength(10).WithMessage("Til kodi 10 ta belgidan oshmasligi kerak");
    }
}
