using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.PropertyViews;
using Mulkchi.Api.Models.Foundations.PropertyViews.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.PropertyViews;

public partial class PropertyViewService
{
    private delegate ValueTask<PropertyView> ReturningPropertyViewFunction();
    private delegate IQueryable<PropertyView> ReturningPropertyViewsFunction();

    private async ValueTask<PropertyView> TryCatch(ReturningPropertyViewFunction returningPropertyViewFunction)
    {
        try
        {
            return await returningPropertyViewFunction();
        }
        catch (NullPropertyViewException nullPropertyViewException)
        {
            throw CreateAndLogValidationException(nullPropertyViewException);
        }
        catch (InvalidPropertyViewException invalidPropertyViewException)
        {
            throw CreateAndLogValidationException(invalidPropertyViewException);
        }
        catch (NotFoundPropertyViewException notFoundPropertyViewException)
        {
            throw CreateAndLogDependencyValidationException(notFoundPropertyViewException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPropertyViewStorageException(
                message: "Failed PropertyView storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedPropertyViewStorageException(
                message: "Failed PropertyView storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedPropertyViewStorageException(
                message: "Failed PropertyView storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPropertyViewServiceException(
                message: "Failed PropertyView service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<PropertyView> TryCatch(ReturningPropertyViewsFunction returningPropertyViewsFunction)
    {
        try
        {
            return returningPropertyViewsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPropertyViewStorageException(
                message: "Failed PropertyView storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPropertyViewServiceException(
                message: "Failed PropertyView service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private PropertyViewValidationException CreateAndLogValidationException(Xeption exception)
    {
        var propertyViewValidationException = new PropertyViewValidationException(
            message: "PropertyView validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(propertyViewValidationException);

        return propertyViewValidationException;
    }

    private PropertyViewDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var propertyViewDependencyValidationException = new PropertyViewDependencyValidationException(
            message: "PropertyView dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(propertyViewDependencyValidationException);

        return propertyViewDependencyValidationException;
    }

    private PropertyViewDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var propertyViewDependencyException = new PropertyViewDependencyException(
            message: "PropertyView dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(propertyViewDependencyException);

        return propertyViewDependencyException;
    }

    private PropertyViewServiceException CreateAndLogServiceException(Xeption exception)
    {
        var propertyViewServiceException = new PropertyViewServiceException(
            message: "PropertyView service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(propertyViewServiceException);

        return propertyViewServiceException;
    }
}
