using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.PropertyImages.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.PropertyImages;

public partial class PropertyImageService
{
    private delegate ValueTask<PropertyImage> ReturningPropertyImageFunction();
    private delegate IQueryable<PropertyImage> ReturningPropertyImagesFunction();

    private async ValueTask<PropertyImage> TryCatch(ReturningPropertyImageFunction returningPropertyImageFunction)
    {
        try
        {
            return await returningPropertyImageFunction();
        }
        catch (NullPropertyImageException nullPropertyImageException)
        {
            throw CreateAndLogValidationException(nullPropertyImageException);
        }
        catch (InvalidPropertyImageException invalidPropertyImageException)
        {
            throw CreateAndLogValidationException(invalidPropertyImageException);
        }
        catch (NotFoundPropertyImageException notFoundPropertyImageException)
        {
            throw CreateAndLogDependencyValidationException(notFoundPropertyImageException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPropertyImageStorageException(
                message: "Failed PropertyImage storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedPropertyImageStorageException(
                message: "Failed PropertyImage storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedPropertyImageStorageException(
                message: "Failed PropertyImage storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPropertyImageServiceException(
                message: "Failed PropertyImage service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<PropertyImage> TryCatch(ReturningPropertyImagesFunction returningPropertyImagesFunction)
    {
        try
        {
            return returningPropertyImagesFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPropertyImageStorageException(
                message: "Failed PropertyImage storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPropertyImageServiceException(
                message: "Failed PropertyImage service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private PropertyImageValidationException CreateAndLogValidationException(Xeption exception)
    {
        var propertyImageValidationException = new PropertyImageValidationException(
            message: "PropertyImage validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(propertyImageValidationException);

        return propertyImageValidationException;
    }

    private PropertyImageDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var propertyImageDependencyValidationException = new PropertyImageDependencyValidationException(
            message: "PropertyImage dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(propertyImageDependencyValidationException);

        return propertyImageDependencyValidationException;
    }

    private PropertyImageDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var propertyImageDependencyException = new PropertyImageDependencyException(
            message: "PropertyImage dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(propertyImageDependencyException);

        return propertyImageDependencyException;
    }

    private PropertyImageServiceException CreateAndLogServiceException(Xeption exception)
    {
        var propertyImageServiceException = new PropertyImageServiceException(
            message: "PropertyImage service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(propertyImageServiceException);

        return propertyImageServiceException;
    }
}
