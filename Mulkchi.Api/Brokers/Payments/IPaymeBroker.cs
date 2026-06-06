namespace Mulkchi.Api.Brokers.Payments;

public interface IPaymeBroker
{
    ValueTask<string> GeneratePaymentUrlAsync(Guid bookingId, decimal amount);
    ValueTask<bool> VerifyTransactionAsync(string transactionId);
    ValueTask<bool> RefundTransactionAsync(string transactionId);
}
