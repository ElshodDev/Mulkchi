using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Discounts;
using Mulkchi.Api.Models.Foundations.Discounts.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Discounts;

public partial class DiscountService
{
    private delegate ValueTask<Discount> ReturningDiscountFunction();
    private delegate IQueryable<Discount> ReturningDiscountsFunction();

    private async ValueTask<Discount> TryCatch(ReturningDiscountFunction returningDiscountFunction)
    {
        try
        {
            return await returningDiscountFunction();
        }
        catch (NullDiscountException nullDiscountException)
        {
            throw CreateAndLogValidationException(nullDiscountException);
        }
        catch (InvalidDiscountException invalidDiscountException)
        {
            throw CreateAndLogValidationException(invalidDiscountException);
        }
        catch (NotFoundDiscountException notFoundDiscountException)
        {
            throw CreateAndLogDependencyValidationException(notFoundDiscountException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedDiscountStorageException(
                message: "Failed Discount storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedDiscountStorageException(
                message: "Failed Discount storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedDiscountStorageException(
                message: "Failed Discount storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedDiscountServiceException(
                message: "Failed Discount service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Discount> TryCatch(ReturningDiscountsFunction returningDiscountsFunction)
    {
        try
        {
            return returningDiscountsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedDiscountStorageException(
                message: "Failed Discount storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedDiscountServiceException(
                message: "Failed Discount service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private DiscountValidationException CreateAndLogValidationException(Xeption exception)
    {
        var discountValidationException = new DiscountValidationException(
            message: "Discount validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(discountValidationException);

        return discountValidationException;
    }

    private DiscountDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var discountDependencyValidationException = new DiscountDependencyValidationException(
            message: "Discount dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(discountDependencyValidationException);

        return discountDependencyValidationException;
    }

    private DiscountDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var discountDependencyException = new DiscountDependencyException(
            message: "Discount dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(discountDependencyException);

        return discountDependencyException;
    }

    private DiscountServiceException CreateAndLogServiceException(Xeption exception)
    {
        var discountServiceException = new DiscountServiceException(
            message: "Discount service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(discountServiceException);

        return discountServiceException;
    }
}
