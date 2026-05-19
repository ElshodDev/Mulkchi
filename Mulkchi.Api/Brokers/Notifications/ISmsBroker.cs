namespace Mulkchi.Api.Brokers.Notifications;

public interface ISmsBroker
{
    Task SendSmsAsync(string phoneNumber, string message);
}
