using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.AIs;
using Mulkchi.Api.Models.Foundations.AIs.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.AiRecommendations;

public partial class AiRecommendationService
{
    private delegate ValueTask<AiRecommendation> ReturningAiRecommendationFunction();
    private delegate IQueryable<AiRecommendation> ReturningAiRecommendationsFunction();

    private async ValueTask<AiRecommendation> TryCatch(ReturningAiRecommendationFunction returningAiRecommendationFunction)
    {
        try
        {
            return await returningAiRecommendationFunction();
        }
        catch (NullAiRecommendationException nullAiRecommendationException)
        {
            throw CreateAndLogValidationException(nullAiRecommendationException);
        }
        catch (InvalidAiRecommendationException invalidAiRecommendationException)
        {
            throw CreateAndLogValidationException(invalidAiRecommendationException);
        }
        catch (NotFoundAiRecommendationException notFoundAiRecommendationException)
        {
            throw CreateAndLogDependencyValidationException(notFoundAiRecommendationException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedAiRecommendationStorageException(
                message: "Failed AiRecommendation storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedAiRecommendationStorageException(
                message: "Failed AiRecommendation storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedAiRecommendationStorageException(
                message: "Failed AiRecommendation storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedAiRecommendationServiceException(
                message: "Failed AiRecommendation service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<AiRecommendation> TryCatch(ReturningAiRecommendationsFunction returningAiRecommendationsFunction)
    {
        try
        {
            return returningAiRecommendationsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedAiRecommendationStorageException(
                message: "Failed AiRecommendation storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedAiRecommendationServiceException(
                message: "Failed AiRecommendation service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private AiRecommendationValidationException CreateAndLogValidationException(Xeption exception)
    {
        var aiRecommendationValidationException = new AiRecommendationValidationException(
            message: "AiRecommendation validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(aiRecommendationValidationException);

        return aiRecommendationValidationException;
    }

    private AiRecommendationDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var aiRecommendationDependencyValidationException = new AiRecommendationDependencyValidationException(
            message: "AiRecommendation dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(aiRecommendationDependencyValidationException);

        return aiRecommendationDependencyValidationException;
    }

    private AiRecommendationDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var aiRecommendationDependencyException = new AiRecommendationDependencyException(
            message: "AiRecommendation dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(aiRecommendationDependencyException);

        return aiRecommendationDependencyException;
    }

    private AiRecommendationServiceException CreateAndLogServiceException(Xeption exception)
    {
        var aiRecommendationServiceException = new AiRecommendationServiceException(
            message: "AiRecommendation service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(aiRecommendationServiceException);

        return aiRecommendationServiceException;
    }
}
