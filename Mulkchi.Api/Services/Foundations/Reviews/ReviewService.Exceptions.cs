using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Reviews;
using Mulkchi.Api.Models.Foundations.Reviews.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Reviews;

public partial class ReviewService
{
    private delegate ValueTask<Review> ReturningReviewFunction();
    private delegate IQueryable<Review> ReturningReviewsFunction();

    private async ValueTask<Review> TryCatch(ReturningReviewFunction returningReviewFunction)
    {
        try
        {
            return await returningReviewFunction();
        }
        catch (NullReviewException nullReviewException)
        {
            throw CreateAndLogValidationException(nullReviewException);
        }
        catch (InvalidReviewException invalidReviewException)
        {
            throw CreateAndLogValidationException(invalidReviewException);
        }
        catch (NotFoundReviewException notFoundReviewException)
        {
            throw CreateAndLogDependencyValidationException(notFoundReviewException);
        }
        catch (AlreadyExistsReviewException alreadyExistsReviewException)
        {
            throw CreateAndLogDependencyValidationException(alreadyExistsReviewException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedReviewStorageException(
                message: "Failed Review storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedReviewStorageException(
                message: "Failed Review storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedReviewStorageException(
                message: "Failed Review storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedReviewServiceException(
                message: "Failed Review service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Review> TryCatch(ReturningReviewsFunction returningReviewsFunction)
    {
        try
        {
            return returningReviewsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedReviewStorageException(
                message: "Failed Review storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedReviewServiceException(
                message: "Failed Review service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private ReviewValidationException CreateAndLogValidationException(Xeption exception)
    {
        var reviewValidationException = new ReviewValidationException(
            message: "Review validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(reviewValidationException);

        return reviewValidationException;
    }

    private ReviewDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var reviewDependencyValidationException = new ReviewDependencyValidationException(
            message: "Review dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(reviewDependencyValidationException);

        return reviewDependencyValidationException;
    }

    private ReviewDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var reviewDependencyException = new ReviewDependencyException(
            message: "Review dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(reviewDependencyException);

        return reviewDependencyException;
    }

    private ReviewServiceException CreateAndLogServiceException(Xeption exception)
    {
        var reviewServiceException = new ReviewServiceException(
            message: "Review service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(reviewServiceException);

        return reviewServiceException;
    }
}
