#nullable disable

namespace Mulkchi.Api.Models.Foundations.Auth.Exceptions;

public class NotFoundPasswordResetTokenException : Exception
{
    public NotFoundPasswordResetTokenException()
        : base("Password reset token not found.")
    {
    }

    public NotFoundPasswordResetTokenException(string message)
        : base(message)
    {
    }

    public NotFoundPasswordResetTokenException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
