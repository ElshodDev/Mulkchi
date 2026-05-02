using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.SavedSearches;
using Mulkchi.Api.Models.Foundations.SavedSearches.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.SavedSearches;

public partial class SavedSearchService
{
    private delegate ValueTask<SavedSearch> ReturningSavedSearchFunction();
    private delegate IQueryable<SavedSearch> ReturningSavedSearchesFunction();

    private async ValueTask<SavedSearch> TryCatch(ReturningSavedSearchFunction returningSavedSearchFunction)
    {
        try
        {
            return await returningSavedSearchFunction();
        }
        catch (NullSavedSearchException nullSavedSearchException)
        {
            throw CreateAndLogValidationException(nullSavedSearchException);
        }
        catch (InvalidSavedSearchException invalidSavedSearchException)
        {
            throw CreateAndLogValidationException(invalidSavedSearchException);
        }
        catch (NotFoundSavedSearchException notFoundSavedSearchException)
        {
            throw CreateAndLogDependencyValidationException(notFoundSavedSearchException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedSavedSearchStorageException(
                message: "Failed SavedSearch storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedSavedSearchStorageException(
                message: "Failed SavedSearch storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedSavedSearchStorageException(
                message: "Failed SavedSearch storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedSavedSearchServiceException(
                message: "Failed SavedSearch service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<SavedSearch> TryCatch(ReturningSavedSearchesFunction returningSavedSearchesFunction)
    {
        try
        {
            return returningSavedSearchesFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedSavedSearchStorageException(
                message: "Failed SavedSearch storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedSavedSearchServiceException(
                message: "Failed SavedSearch service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private SavedSearchValidationException CreateAndLogValidationException(Xeption exception)
    {
        var savedSearchValidationException = new SavedSearchValidationException(
            message: "SavedSearch validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(savedSearchValidationException);

        return savedSearchValidationException;
    }

    private SavedSearchDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var savedSearchDependencyValidationException = new SavedSearchDependencyValidationException(
            message: "SavedSearch dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(savedSearchDependencyValidationException);

        return savedSearchDependencyValidationException;
    }

    private SavedSearchDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var savedSearchDependencyException = new SavedSearchDependencyException(
            message: "SavedSearch dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(savedSearchDependencyException);

        return savedSearchDependencyException;
    }

    private SavedSearchServiceException CreateAndLogServiceException(Xeption exception)
    {
        var savedSearchServiceException = new SavedSearchServiceException(
            message: "SavedSearch service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(savedSearchServiceException);

        return savedSearchServiceException;
    }
}
