using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Users;

public partial class UserService
{
    private delegate ValueTask<User> ReturningUserFunction();
    private delegate IQueryable<User> ReturningUsersFunction();

    private async ValueTask<User> TryCatch(ReturningUserFunction returningUserFunction)
    {
        try
        {
            return await returningUserFunction();
        }
        catch (NullUserException nullUserException)
        {
            throw CreateAndLogValidationException(nullUserException);
        }
        catch (InvalidUserException invalidUserException)
        {
            throw CreateAndLogValidationException(invalidUserException);
        }
        catch (NotFoundUserException notFoundUserException)
        {
            throw CreateAndLogDependencyValidationException(notFoundUserException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedUserStorageException(
                message: "Failed User storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedUserStorageException(
                message: "Failed User storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedUserStorageException(
                message: "Failed User storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedUserServiceException(
                message: "Failed User service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<User> TryCatch(ReturningUsersFunction returningUsersFunction)
    {
        try
        {
            return returningUsersFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedUserStorageException(
                message: "Failed User storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedUserServiceException(
                message: "Failed User service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private UserValidationException CreateAndLogValidationException(Xeption exception)
    {
        var userValidationException = new UserValidationException(
            message: "User validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(userValidationException);

        return userValidationException;
    }

    private UserDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var userDependencyValidationException = new UserDependencyValidationException(
            message: "User dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(userDependencyValidationException);

        return userDependencyValidationException;
    }

    private UserDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var userDependencyException = new UserDependencyException(
            message: "User dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(userDependencyException);

        return userDependencyException;
    }

    private UserServiceException CreateAndLogServiceException(Xeption exception)
    {
        var userServiceException = new UserServiceException(
            message: "User service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(userServiceException);

        return userServiceException;
    }
}
