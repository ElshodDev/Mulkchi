using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Brokers.Notifications;

/// <summary>
/// Stub SMS broker that logs messages instead of sending real SMS.
/// Replace with a real provider (Eskiz, Twilio, etc.) in production.
/// </summary>
public class StubSmsBroker : ISmsBroker
{
    private readonly ILogger<StubSmsBroker> logger;

    public StubSmsBroker(ILogger<StubSmsBroker> logger)
    {
        this.logger = logger;
    }

    public Task SendSmsAsync(string phoneNumber, string message)
    {
        // Sanitize to prevent log forging
        var sanitizedPhone = phoneNumber.Replace('\n', '_').Replace('\r', '_');
        this.logger.LogInformation("[SMS STUB] To: {Phone} | Message sent", sanitizedPhone);
        return Task.CompletedTask;
    }
}
