namespace Mulkchi.Api.Models.Foundations.Auth.Exceptions;

public class InvalidCredentialAuthException : Exception
{
    public InvalidCredentialAuthException(string message)
        : base(message)
    { }

    public InvalidCredentialAuthException(string message, Exception innerException)
        : base(message, innerException)
    { }
}
