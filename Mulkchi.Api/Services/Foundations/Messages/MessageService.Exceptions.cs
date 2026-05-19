using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Messages;
using Mulkchi.Api.Models.Foundations.Messages.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Messages;

public partial class MessageService
{
    private delegate ValueTask<Message> ReturningMessageFunction();
    private delegate IQueryable<Message> ReturningMessagesFunction();

    private async ValueTask<Message> TryCatch(ReturningMessageFunction returningMessageFunction)
    {
        try
        {
            return await returningMessageFunction();
        }
        catch (NullMessageException nullMessageException)
        {
            throw CreateAndLogValidationException(nullMessageException);
        }
        catch (InvalidMessageException invalidMessageException)
        {
            throw CreateAndLogValidationException(invalidMessageException);
        }
        catch (NotFoundMessageException notFoundMessageException)
        {
            throw CreateAndLogDependencyValidationException(notFoundMessageException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedMessageStorageException(
                message: "Failed Message storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedMessageStorageException(
                message: "Failed Message storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedMessageStorageException(
                message: "Failed Message storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedMessageServiceException(
                message: "Failed Message service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Message> TryCatch(ReturningMessagesFunction returningMessagesFunction)
    {
        try
        {
            return returningMessagesFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedMessageStorageException(
                message: "Failed Message storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedMessageServiceException(
                message: "Failed Message service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private MessageValidationException CreateAndLogValidationException(Xeption exception)
    {
        var messageValidationException = new MessageValidationException(
            message: "Message validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(messageValidationException);

        return messageValidationException;
    }

    private MessageDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var messageDependencyValidationException = new MessageDependencyValidationException(
            message: "Message dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(messageDependencyValidationException);

        return messageDependencyValidationException;
    }

    private MessageDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var messageDependencyException = new MessageDependencyException(
            message: "Message dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(messageDependencyException);

        return messageDependencyException;
    }

    private MessageServiceException CreateAndLogServiceException(Xeption exception)
    {
        var messageServiceException = new MessageServiceException(
            message: "Message service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(messageServiceException);

        return messageServiceException;
    }
}
