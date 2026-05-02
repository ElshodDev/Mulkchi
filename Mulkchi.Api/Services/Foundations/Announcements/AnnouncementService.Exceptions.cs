using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Announcements;
using Mulkchi.Api.Models.Foundations.Announcements.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Announcements;

public partial class AnnouncementService
{
    private delegate ValueTask<Announcement> ReturningAnnouncementFunction();
    private delegate IQueryable<Announcement> ReturningAnnouncementsFunction();

    private async ValueTask<Announcement> TryCatch(ReturningAnnouncementFunction returningAnnouncementFunction)
    {
        try
        {
            return await returningAnnouncementFunction();
        }
        catch (NullAnnouncementException nullAnnouncementException)
        {
            throw CreateAndLogValidationException(nullAnnouncementException);
        }
        catch (InvalidAnnouncementException invalidAnnouncementException)
        {
            throw CreateAndLogValidationException(invalidAnnouncementException);
        }
        catch (NotFoundAnnouncementException notFoundAnnouncementException)
        {
            throw CreateAndLogDependencyValidationException(notFoundAnnouncementException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedAnnouncementStorageException(
                message: "Failed Announcement storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedAnnouncementStorageException(
                message: "Failed Announcement storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedAnnouncementStorageException(
                message: "Failed Announcement storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedAnnouncementServiceException(
                message: "Failed Announcement service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Announcement> TryCatch(ReturningAnnouncementsFunction returningAnnouncementsFunction)
    {
        try
        {
            return returningAnnouncementsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedAnnouncementStorageException(
                message: "Failed Announcement storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedAnnouncementServiceException(
                message: "Failed Announcement service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private AnnouncementValidationException CreateAndLogValidationException(Xeption exception)
    {
        var announcementValidationException = new AnnouncementValidationException(
            message: "Announcement validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(announcementValidationException);

        return announcementValidationException;
    }

    private AnnouncementDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var announcementDependencyValidationException = new AnnouncementDependencyValidationException(
            message: "Announcement dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(announcementDependencyValidationException);

        return announcementDependencyValidationException;
    }

    private AnnouncementDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var announcementDependencyException = new AnnouncementDependencyException(
            message: "Announcement dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(announcementDependencyException);

        return announcementDependencyException;
    }

    private AnnouncementServiceException CreateAndLogServiceException(Xeption exception)
    {
        var announcementServiceException = new AnnouncementServiceException(
            message: "Announcement service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(announcementServiceException);

        return announcementServiceException;
    }
}
