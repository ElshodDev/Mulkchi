using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Models.Foundations.Payments.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Payments;

public partial class PaymentService
{
    private delegate ValueTask<Payment> ReturningPaymentFunction();
    private delegate IQueryable<Payment> ReturningPaymentsFunction();

    private async ValueTask<Payment> TryCatch(ReturningPaymentFunction returningPaymentFunction)
    {
        try
        {
            return await returningPaymentFunction();
        }
        catch (NullPaymentException nullPaymentException)
        {
            throw CreateAndLogValidationException(nullPaymentException);
        }
        catch (InvalidPaymentException invalidPaymentException)
        {
            throw CreateAndLogValidationException(invalidPaymentException);
        }
        catch (NotFoundPaymentException notFoundPaymentException)
        {
            throw CreateAndLogDependencyValidationException(notFoundPaymentException);
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPaymentStorageException(
                message: "Failed Payment storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
        {
            var failedStorage = new FailedPaymentStorageException(
                message: "Failed Payment storage error occurred, contact support.",
                innerException: dbUpdateConcurrencyException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (DbUpdateException dbUpdateException)
        {
            var failedStorage = new FailedPaymentStorageException(
                message: "Failed Payment storage error occurred, contact support.",
                innerException: dbUpdateException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPaymentServiceException(
                message: "Failed Payment service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private IQueryable<Payment> TryCatch(ReturningPaymentsFunction returningPaymentsFunction)
    {
        try
        {
            return returningPaymentsFunction();
        }
        catch (DbException dbException)
        {
            var failedStorage = new FailedPaymentStorageException(
                message: "Failed Payment storage error occurred, contact support.",
                innerException: dbException);

            throw CreateAndLogDependencyException(failedStorage);
        }
        catch (Exception exception)
        {
            var failedService = new FailedPaymentServiceException(
                message: "Failed Payment service error occurred, contact support.",
                innerException: exception);

            throw CreateAndLogServiceException(failedService);
        }
    }

    private PaymentValidationException CreateAndLogValidationException(Xeption exception)
    {
        var paymentValidationException = new PaymentValidationException(
            message: "Payment validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(paymentValidationException);

        return paymentValidationException;
    }

    private PaymentDependencyValidationException CreateAndLogDependencyValidationException(Xeption exception)
    {
        var paymentDependencyValidationException = new PaymentDependencyValidationException(
            message: "Payment dependency validation error occurred, fix the errors and try again.",
            innerException: exception);

        this.loggingBroker.LogError(paymentDependencyValidationException);

        return paymentDependencyValidationException;
    }

    private PaymentDependencyException CreateAndLogDependencyException(Xeption exception)
    {
        var paymentDependencyException = new PaymentDependencyException(
            message: "Payment dependency error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(paymentDependencyException);

        return paymentDependencyException;
    }

    private PaymentServiceException CreateAndLogServiceException(Xeption exception)
    {
        var paymentServiceException = new PaymentServiceException(
            message: "Payment service error occurred, contact support.",
            innerException: exception);

        this.loggingBroker.LogError(paymentServiceException);

        return paymentServiceException;
    }
}
