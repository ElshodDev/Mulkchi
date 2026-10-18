using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Users;

public partial class UserService
{
    private void ValidateUserOnAdd(User user)
    {
        ValidateUserIsNotNull(user);
        Validate(
        (Rule: IsInvalid(user.Id), Parameter: nameof(User.Id)),
        (Rule: IsInvalid(user.FirstName), Parameter: nameof(User.FirstName)),
        (Rule: IsInvalid(user.LastName), Parameter: nameof(User.LastName)),
        (Rule: IsInvalid(user.Email), Parameter: nameof(User.Email)),
        (Rule: IsInvalid(user.Phone), Parameter: nameof(User.Phone)),
        (Rule: IsInvalid(user.PasswordHash), Parameter: nameof(User.PasswordHash)));
    }

    private void ValidateUserOnModify(User user)
    {
        ValidateUserIsNotNull(user);
        Validate(
        (Rule: IsInvalid(user.Id), Parameter: nameof(User.Id)),
        (Rule: IsInvalid(user.FirstName), Parameter: nameof(User.FirstName)),
        (Rule: IsInvalid(user.LastName), Parameter: nameof(User.LastName)),
        (Rule: IsInvalid(user.Email), Parameter: nameof(User.Email)),
        (Rule: IsInvalid(user.Phone), Parameter: nameof(User.Phone)));
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new InvalidUserException(
                message: "User id is invalid.");
        }
    }

    private static void ValidateUserIsNotNull(User user)
    {
        if (user is null)
            throw new NullUserException(message: "User is null.");
    }

    private static dynamic IsInvalid(Guid id) => new
    {
        Condition = id == Guid.Empty,
        Message = "Id is required."
    };

    private static dynamic IsInvalid(string? text) => new
    {
        Condition = string.IsNullOrWhiteSpace(text),
        Message = "Value is required."
    };

    private void Validate(params (dynamic Rule, string Parameter)[] validations)
    {
        var invalidUserException =
            new InvalidUserException(message: "User data is invalid.");

        foreach ((dynamic rule, string parameter) in validations)
        {
            if (rule.Condition)
                invalidUserException.UpsertDataList(parameter, rule.Message);
        }

        invalidUserException.ThrowIfContainsErrors();
    }
}
