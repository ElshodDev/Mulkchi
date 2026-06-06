using Mulkchi.Api.Brokers.Loggings;

namespace Mulkchi.Api.Brokers.Payments;

public class PaymeBroker : IPaymeBroker
{
    private readonly ILoggingBroker loggingBroker;

    public PaymeBroker(ILoggingBroker loggingBroker)
    {
        this.loggingBroker = loggingBroker;
    }

    public ValueTask<string> GeneratePaymentUrlAsync(Guid bookingId, decimal amount)
    {
        // Sandbox Mock: Real implementation would use Payme Merchant API
        string encodedAmount = (amount * 100).ToString("F0");
        string url = $"https://checkout.paycom.uz/base64-encoded-payload-{bookingId}-{encodedAmount}";
        return new ValueTask<string>(url);
    }

    public ValueTask<bool> VerifyTransactionAsync(string transactionId)
    {
        // Sandbox Mock
        return new ValueTask<bool>(true);
    }

    public ValueTask<bool> RefundTransactionAsync(string transactionId)
    {
        // Sandbox Mock
        return new ValueTask<bool>(true);
    }
}
