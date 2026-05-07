using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Services.Foundations.Auth;

public interface ITelegramAuthService
{
    /// <summary>
    /// Telegram login ni boshlash - deep link va session yaratish
    /// </summary>
    Task<TelegramInitResponse> InitiateLoginAsync();

    /// <summary>
    /// Session status ni tekshirish (frontend polling uchun)
    /// </summary>
    Task<TelegramSessionStatus> CheckSessionStatusAsync(string sessionId);

    /// <summary>
    /// Telegram bot dan kelgan update ni qayta ishlash
    /// </summary>
    Task HandleBotUpdateAsync(TelegramUpdate update);

    /// <summary>
    /// OTP kod yuborish (bot orqali)
    /// </summary>
    Task SendOtpCodeAsync(long chatId, string code);
}
