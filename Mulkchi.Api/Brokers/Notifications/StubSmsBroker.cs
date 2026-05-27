using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Brokers.Notifications;

public class StubSmsBroker : ISmsBroker
{
    private readonly ILogger<StubSmsBroker> logger;

    public StubSmsBroker(ILogger<StubSmsBroker> logger)
    {
        this.logger = logger;
    }

    public Task SendSmsAsync(string phoneNumber, string message)
    {
        var sanitizedPhone = phoneNumber.Replace('\n', '_').Replace('\r', '_');
        this.logger.LogInformation("[SMS STUB] To: {Phone} | Message sent", sanitizedPhone);
        return Task.CompletedTask;
    }
}
