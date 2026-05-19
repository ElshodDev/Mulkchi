using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Properties.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Properties;

public partial class PropertyService
{
    private delegate ValueTask<Property> ReturningPropertyFunction();
    private delegate IQueryable<Property> ReturningPropertiesFunction();

    private async ValueTask<Property> TryCatch(ReturningPropertyFunction returningPropertyFunction)
    {
        try
        {
            return await returningPropertyFunction();
        }
        catch (NullPropertyException nullPropertyException)
        {
            throw CreateAndLogValidationException(nullPropertyException);
        }
        catch (InvalidPropertyException invalidPropertyException)
        {
            throw CreateAndLogValidationException(invalidPropertyException);
        }
        catch (NotFoundPropertyException)
        {
            throw;
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPropertyStorageException(
                message: "Failed Property storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedPropertyStorageException(
                message: "Failed Property storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedPropertyStorageException(
                message: "Failed Property storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPropertyServiceException(
                message: "Failed Property service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Property> TryCatch(ReturningPropertiesFunction returningPropertiesFunction)
    {
        try
        {
            return returningPropertiesFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPropertyStorageException(
                message: "Failed Property storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPropertyServiceException(
                message: "Failed Property service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private PropertyValidationException CreateAndLogValidationException(Xeption exception)
    {
        var propertyValidationException = new PropertyValidationException(
            message: "Property validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(propertyValidationException);

        return propertyValidationException;
    }

    private PropertyDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var propertyDependencyValidationException = new PropertyDependencyValidationException(
            message: "Property dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(propertyDependencyValidationException);

        return propertyDependencyValidationException;
    }

    private PropertyDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var propertyDependencyException = new PropertyDependencyException(
            message: "Property dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(propertyDependencyException);

        return propertyDependencyException;
    }

    private PropertyServiceException CreateAndLogServiceException(Xeption exception)
    {
        var propertyServiceException = new PropertyServiceException(
            message: "Property service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(propertyServiceException);

        return propertyServiceException;
    }
}
