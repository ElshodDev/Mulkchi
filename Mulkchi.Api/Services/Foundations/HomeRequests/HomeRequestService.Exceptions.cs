using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.HomeRequests;
using Mulkchi.Api.Models.Foundations.HomeRequests.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.HomeRequests;

public partial class HomeRequestService
{
    private delegate ValueTask<HomeRequest> ReturningHomeRequestFunction();
    private delegate IQueryable<HomeRequest> ReturningHomeRequestsFunction();

    private async ValueTask<HomeRequest> TryCatch(ReturningHomeRequestFunction returningHomeRequestFunction)
    {
        try
        {
            return await returningHomeRequestFunction();
        }
        catch (NullHomeRequestException nullHomeRequestException)
        {
            throw CreateAndLogValidationException(nullHomeRequestException);
        }
        catch (InvalidHomeRequestException invalidHomeRequestException)
        {
            throw CreateAndLogValidationException(invalidHomeRequestException);
        }
        catch (NotFoundHomeRequestException notFoundHomeRequestException)
        {
            throw CreateAndLogDependencyValidationException(notFoundHomeRequestException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedHomeRequestStorageException(
                message: "Failed HomeRequest storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedHomeRequestStorageException(
                message: "Failed HomeRequest storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedHomeRequestStorageException(
                message: "Failed HomeRequest storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedHomeRequestServiceException(
                message: "Failed HomeRequest service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<HomeRequest> TryCatch(ReturningHomeRequestsFunction returningHomeRequestsFunction)
    {
        try
        {
            return returningHomeRequestsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedHomeRequestStorageException(
                message: "Failed HomeRequest storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedHomeRequestServiceException(
                message: "Failed HomeRequest service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private HomeRequestValidationException CreateAndLogValidationException(Xeption exception)
    {
        var homeRequestValidationException = new HomeRequestValidationException(
            message: "HomeRequest validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(homeRequestValidationException);

        return homeRequestValidationException;
    }

    private HomeRequestDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var homeRequestDependencyValidationException = new HomeRequestDependencyValidationException(
            message: "HomeRequest dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(homeRequestDependencyValidationException);

        return homeRequestDependencyValidationException;
    }

    private HomeRequestDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var homeRequestDependencyException = new HomeRequestDependencyException(
            message: "HomeRequest dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(homeRequestDependencyException);

        return homeRequestDependencyException;
    }

    private HomeRequestServiceException CreateAndLogServiceException(Xeption exception)
    {
        var homeRequestServiceException = new HomeRequestServiceException(
            message: "HomeRequest service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(homeRequestServiceException);

        return homeRequestServiceException;
    }
}
