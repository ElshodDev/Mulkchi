using FluentValidation;
using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email kiritilishi shart")
            .EmailAddress().WithMessage("Email formati noto'g'ri");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parol kiritilishi shart")
            .MinimumLength(6).WithMessage("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
    }
}
