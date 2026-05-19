namespace Mulkchi.Api.Brokers.Notifications;

public interface IEmailBroker
{
    Task SendEmailAsync(string to, string subject, string body);
}
