using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Favorites;
using Mulkchi.Api.Models.Foundations.Favorites.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Favorites;

public partial class FavoriteService
{
    private delegate ValueTask<Favorite> ReturningFavoriteFunction();
    private delegate IQueryable<Favorite> ReturningFavoritesFunction();

    private async ValueTask<Favorite> TryCatch(ReturningFavoriteFunction returningFavoriteFunction)
    {
        try
        {
            return await returningFavoriteFunction();
        }
        catch (NullFavoriteException nullFavoriteException)
        {
            throw CreateAndLogValidationException(nullFavoriteException);
        }
        catch (InvalidFavoriteException invalidFavoriteException)
        {
            throw CreateAndLogValidationException(invalidFavoriteException);
        }
        catch (NotFoundFavoriteException notFoundFavoriteException)
        {
            throw CreateAndLogDependencyValidationException(notFoundFavoriteException);
        }
        catch (AlreadyExistsFavoriteException alreadyExistsFavoriteException)
        {
            throw CreateAndLogDependencyValidationException(alreadyExistsFavoriteException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedFavoriteStorageException(
                message: "Failed Favorite storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedFavoriteStorageException(
                message: "Failed Favorite storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedFavoriteStorageException(
                message: "Failed Favorite storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (UnauthorizedAccessException unauthorizedAccessException)
        {
            var exception = new Xeption(unauthorizedAccessException.Message, unauthorizedAccessException);
            throw CreateAndLogDependencyValidationException(exception);
        }
        catch (Exception exception)
        {
            var failedService = new FailedFavoriteServiceException(
                message: "Failed Favorite service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Favorite> TryCatch(ReturningFavoritesFunction returningFavoritesFunction)
    {
        try
        {
            return returningFavoritesFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedFavoriteStorageException(
                message: "Failed Favorite storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedFavoriteServiceException(
                message: "Failed Favorite service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private FavoriteValidationException CreateAndLogValidationException(Xeption exception)
    {
        var favoriteValidationException = new FavoriteValidationException(
            message: "Favorite validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(favoriteValidationException);

        return favoriteValidationException;
    }

    private FavoriteDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var favoriteDependencyValidationException = new FavoriteDependencyValidationException(
            message: "Favorite dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(favoriteDependencyValidationException);

        return favoriteDependencyValidationException;
    }

    private FavoriteDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var favoriteDependencyException = new FavoriteDependencyException(
            message: "Favorite dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(favoriteDependencyException);

        return favoriteDependencyException;
    }

    private FavoriteServiceException CreateAndLogServiceException(Xeption exception)
    {
        var favoriteServiceException = new FavoriteServiceException(
            message: "Favorite service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(favoriteServiceException);

        return favoriteServiceException;
    }
}
