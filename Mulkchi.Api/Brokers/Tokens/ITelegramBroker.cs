namespace Mulkchi.Api.Brokers.Tokens;

public interface ITelegramBroker
{
    Task SendMessageAsync(long chatId, string text);

    Task SendOtpCodeAsync(long chatId, string code, string appName = "Mulkchi");
}
