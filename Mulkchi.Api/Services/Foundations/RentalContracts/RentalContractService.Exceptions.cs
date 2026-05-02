using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.RentalContracts;
using Mulkchi.Api.Models.Foundations.RentalContracts.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.RentalContracts;

public partial class RentalContractService
{
    private delegate ValueTask<RentalContract> ReturningRentalContractFunction();
    private delegate IQueryable<RentalContract> ReturningRentalContractsFunction();

    private async ValueTask<RentalContract> TryCatch(ReturningRentalContractFunction returningRentalContractFunction)
    {
        try
        {
            return await returningRentalContractFunction();
        }
        catch (NullRentalContractException nullRentalContractException)
        {
            throw CreateAndLogValidationException(nullRentalContractException);
        }
        catch (InvalidRentalContractException invalidRentalContractException)
        {
            throw CreateAndLogValidationException(invalidRentalContractException);
        }
        catch (NotFoundRentalContractException notFoundRentalContractException)
        {
            throw CreateAndLogDependencyValidationException(notFoundRentalContractException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedRentalContractStorageException(
                message: "Failed RentalContract storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedRentalContractStorageException(
                message: "Failed RentalContract storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedRentalContractStorageException(
                message: "Failed RentalContract storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedRentalContractServiceException(
                message: "Failed RentalContract service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<RentalContract> TryCatch(ReturningRentalContractsFunction returningRentalContractsFunction)
    {
        try
        {
            return returningRentalContractsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedRentalContractStorageException(
                message: "Failed RentalContract storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedRentalContractServiceException(
                message: "Failed RentalContract service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private RentalContractValidationException CreateAndLogValidationException(Xeption exception)
    {
        var rentalContractValidationException = new RentalContractValidationException(
            message: "RentalContract validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(rentalContractValidationException);

        return rentalContractValidationException;
    }

    private RentalContractDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var rentalContractDependencyValidationException = new RentalContractDependencyValidationException(
            message: "RentalContract dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(rentalContractDependencyValidationException);

        return rentalContractDependencyValidationException;
    }

    private RentalContractDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var rentalContractDependencyException = new RentalContractDependencyException(
            message: "RentalContract dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(rentalContractDependencyException);

        return rentalContractDependencyException;
    }

    private RentalContractServiceException CreateAndLogServiceException(Xeption exception)
    {
        var rentalContractServiceException = new RentalContractServiceException(
            message: "RentalContract service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(rentalContractServiceException);

        return rentalContractServiceException;
    }
}
