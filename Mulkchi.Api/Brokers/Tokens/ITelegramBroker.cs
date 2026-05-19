namespace Mulkchi.Api.Brokers.Tokens;

public interface ITelegramBroker
{
    /// <summary>
    /// Telegram bot orqali xabar yuborish
    /// </summary>
    Task SendMessageAsync(long chatId, string text);

    /// <summary>
    /// OTP kodini Telegram orqali yuborish
    /// </summary>
    Task SendOtpCodeAsync(long chatId, string code, string appName = "Mulkchi");
}
