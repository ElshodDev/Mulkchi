using Mulkchi.Api.Brokers.Loggings;

namespace Mulkchi.Api.Brokers.Payments;

public class ClickBroker : IClickBroker
{
    private readonly ILoggingBroker loggingBroker;

    public ClickBroker(ILoggingBroker loggingBroker)
    {
        this.loggingBroker = loggingBroker;
    }

    public ValueTask<string> GeneratePaymentUrlAsync(Guid bookingId, decimal amount)
    {
        // Sandbox Mock: Real implementation would use Click Merchant API
        string url = $"https://my.click.uz/services/pay?service_id=12345&merchant_id=6789&amount={amount}&transaction_param={bookingId}";
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
