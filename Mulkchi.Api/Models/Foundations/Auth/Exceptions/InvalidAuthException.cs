#nullable disable

using Xeptions;

namespace Mulkchi.Api.Models.Foundations.Auth.Exceptions;

public class InvalidAuthException : Xeption
{
    public InvalidAuthException()
        : base("Invalid authentication data.")
    {
    }

    public InvalidAuthException(string message)
        : base(message)
    {
    }

    public InvalidAuthException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
