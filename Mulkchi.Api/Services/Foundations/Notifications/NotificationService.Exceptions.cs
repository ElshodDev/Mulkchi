using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Models.Foundations.Notifications.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Notifications;

public partial class NotificationService
{
    private delegate ValueTask<Notification> ReturningNotificationFunction();
    private delegate IQueryable<Notification> ReturningNotificationsFunction();

    private async ValueTask<Notification> TryCatch(ReturningNotificationFunction returningNotificationFunction)
    {
        try
        {
            return await returningNotificationFunction();
        }
        catch (NullNotificationException nullNotificationException)
        {
            throw CreateAndLogValidationException(nullNotificationException);
        }
        catch (InvalidNotificationException invalidNotificationException)
        {
            throw CreateAndLogValidationException(invalidNotificationException);
        }
        catch (NotFoundNotificationException notFoundNotificationException)
        {
            throw CreateAndLogDependencyValidationException(notFoundNotificationException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedNotificationStorageException(
                message: "Failed Notification storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedNotificationStorageException(
                message: "Failed Notification storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedNotificationStorageException(
                message: "Failed Notification storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedNotificationServiceException(
                message: "Failed Notification service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Notification> TryCatch(ReturningNotificationsFunction returningNotificationsFunction)
    {
        try
        {
            return returningNotificationsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedNotificationStorageException(
                message: "Failed Notification storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedNotificationServiceException(
                message: "Failed Notification service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private NotificationValidationException CreateAndLogValidationException(Xeption exception)
    {
        var notificationValidationException = new NotificationValidationException(
            message: "Notification validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(notificationValidationException);

        return notificationValidationException;
    }

    private NotificationDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var notificationDependencyValidationException = new NotificationDependencyValidationException(
            message: "Notification dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(notificationDependencyValidationException);

        return notificationDependencyValidationException;
    }

    private NotificationDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var notificationDependencyException = new NotificationDependencyException(
            message: "Notification dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(notificationDependencyException);

        return notificationDependencyException;
    }

    private NotificationServiceException CreateAndLogServiceException(Xeption exception)
    {
        var notificationServiceException = new NotificationServiceException(
            message: "Notification service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(notificationServiceException);

        return notificationServiceException;
    }
}
