using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Discounts;
using Mulkchi.Api.Models.Foundations.Discounts.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.DiscountUsages;

public partial class DiscountUsageService
{
    private delegate ValueTask<DiscountUsage> ReturningDiscountUsageFunction();
    private delegate IQueryable<DiscountUsage> ReturningDiscountUsagesFunction();

    private async ValueTask<DiscountUsage> TryCatch(ReturningDiscountUsageFunction returningDiscountUsageFunction)
    {
        try
        {
            return await returningDiscountUsageFunction();
        }
        catch (NullDiscountUsageException nullDiscountUsageException)
        {
            throw CreateAndLogValidationException(nullDiscountUsageException);
        }
        catch (InvalidDiscountUsageException invalidDiscountUsageException)
        {
            throw CreateAndLogValidationException(invalidDiscountUsageException);
        }
        catch (NotFoundDiscountUsageException notFoundDiscountUsageException)
        {
            throw CreateAndLogDependencyValidationException(notFoundDiscountUsageException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedDiscountUsageStorageException(
                message: "Failed discount usage storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedDiscountUsageStorageException(
                message: "Failed discount usage storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedDiscountUsageStorageException(
                message: "Failed discount usage storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedDiscountUsageServiceException(
                message: "Failed discount usage service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<DiscountUsage> TryCatch(ReturningDiscountUsagesFunction returningDiscountUsagesFunction)
    {
        try
        {
            return returningDiscountUsagesFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedDiscountUsageStorageException(
                message: "Failed discount usage storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedDiscountUsageServiceException(
                message: "Failed discount usage service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private DiscountUsageValidationException CreateAndLogValidationException(Xeption exception)
    {
        var discountUsageValidationException = new DiscountUsageValidationException(
            message: "Discount usage validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(discountUsageValidationException);

        return discountUsageValidationException;
    }

    private DiscountUsageDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var discountUsageDependencyValidationException = new DiscountUsageDependencyValidationException(
            message: "Discount usage dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(discountUsageDependencyValidationException);

        return discountUsageDependencyValidationException;
    }

    private DiscountUsageDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var discountUsageDependencyException = new DiscountUsageDependencyException(
            message: "Discount usage dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(discountUsageDependencyException);

        return discountUsageDependencyException;
    }

    private DiscountUsageServiceException CreateAndLogServiceException(Xeption exception)
    {
        var discountUsageServiceException = new DiscountUsageServiceException(
            message: "Discount usage service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(discountUsageServiceException);

        return discountUsageServiceException;
    }
}
