using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Auth;

public partial class AuthService
{
    private delegate ValueTask<AuthResponse> ReturningAuthResponseFunction();
    private delegate ValueTask<string> ReturningStringFunction();
    private delegate ValueTask ReturningNothingFunction();

    private async ValueTask<string> TryCatch(ReturningStringFunction returningStringFunction)
    {
        try
        {
            return await returningStringFunction();
        }
        catch (InvalidAuthException invalidAuthException)
        {
            throw CreateAndLogValidationException(invalidAuthException);
        }
        catch (InvalidLoginRequestException invalidLoginRequestException)
        {
            throw CreateAndLogValidationException(invalidLoginRequestException);
        }
        catch (InvalidRegisterRequestException invalidRegisterRequestException)
        {
            throw CreateAndLogValidationException(invalidRegisterRequestException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedAuthServiceException(
                message: "Failed auth service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private async ValueTask<AuthResponse> TryCatch(ReturningAuthResponseFunction returningAuthResponseFunction)
    {
        try
        {
            return await returningAuthResponseFunction();
        }
        catch (NullLoginRequestException nullLoginRequestException)
        {
            throw CreateAndLogValidationException(nullLoginRequestException);
        }
        catch (NullRegisterRequestException nullRegisterRequestException)
        {
            throw CreateAndLogValidationException(nullRegisterRequestException);
        }
        catch (InvalidLoginRequestException invalidLoginRequestException)
        {
            throw CreateAndLogValidationException(invalidLoginRequestException);
        }
        catch (InvalidRegisterRequestException invalidRegisterRequestException)
        {
            throw CreateAndLogValidationException(invalidRegisterRequestException);
        }
        catch (InvalidAuthException invalidAuthException)
        {
            throw CreateAndLogValidationException(invalidAuthException);
        }
        catch (InvalidRefreshTokenException invalidRefreshTokenException)
        {
            throw CreateAndLogValidationException(invalidRefreshTokenException);
        }
        catch (NotFoundUserByEmailException notFoundUserByEmailException)
        {
            throw CreateAndLogDependencyValidationException(notFoundUserByEmailException);
        }
        catch (AlreadyExistsUserEmailException alreadyExistsUserEmailException)
        {
            throw CreateAndLogDependencyValidationException(alreadyExistsUserEmailException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            if (IsDuplicateUserEmailConflict(dbUpdateException))
            {
                throw CreateAndLogDependencyValidationException(
                    new AlreadyExistsUserEmailException("A user with this email already exists."));
            }

            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedAuthServiceException(
                message: "Failed auth service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private async ValueTask TryCatch(ReturningNothingFunction returningNothingFunction)
    {
        try
        {
            await returningNothingFunction();
        }
        catch (InvalidRefreshTokenException invalidRefreshTokenException)
        {
            throw CreateAndLogValidationException(invalidRefreshTokenException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedAuthStorageException(
                message: "Failed auth storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedAuthServiceException(
                message: "Failed auth service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private AuthValidationException CreateAndLogValidationException(Xeption exception)
    {
        var authValidationException = new AuthValidationException(
            message: "Auth validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(authValidationException);

        return authValidationException;
    }

    private AuthDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var authDependencyValidationException = new AuthDependencyValidationException(
            message: "Auth dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(authDependencyValidationException);

        return authDependencyValidationException;
    }

    private AuthDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var authDependencyException = new AuthDependencyException(
            message: "Auth dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(authDependencyException);

        return authDependencyException;
    }

    private AuthServiceException CreateAndLogServiceException(Xeption exception)
    {
        var authServiceException = new AuthServiceException(
            message: "Auth service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(authServiceException);

        return authServiceException;
    }

    private static bool IsDuplicateUserEmailConflict(DbUpdateException dbUpdateException)
    {
        static bool IsUsersEmailConstraintText(string text) =>
            text.Contains("IX_Users_Email", StringComparison.OrdinalIgnoreCase) ||
            (text.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) &&
             text.Contains("dbo.Users", StringComparison.OrdinalIgnoreCase));

        // Database-agnostic duplicate key check (works with SQL Server and PostgreSQL)
        if (dbUpdateException.InnerException is DbException dbEx)
        {
            // Check for common duplicate key error indicators in the message
            string message = dbEx.Message ?? "";
            if (IsUsersEmailConstraintText(message) ||
                message.Contains("unique constraint", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("2601", StringComparison.OrdinalIgnoreCase) || // SQL Server
                message.Contains("2627", StringComparison.OrdinalIgnoreCase) || // SQL Server
                message.Contains("23505", StringComparison.OrdinalIgnoreCase))   // PostgreSQL
            {
                return true;
            }
        }

        string errorText = string.IsNullOrWhiteSpace(dbUpdateException.InnerException?.Message)
            ? dbUpdateException.Message
            : $"{dbUpdateException.Message} {dbUpdateException.InnerException.Message}";

        return IsUsersEmailConstraintText(errorText);
    }
}
