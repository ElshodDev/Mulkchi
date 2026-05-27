using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Services.Foundations.Auth;

public interface ITelegramAuthService
{
    Task<TelegramInitResponse> InitiateLoginAsync();

    Task<TelegramSessionStatus> CheckSessionStatusAsync(string sessionId);

    Task HandleBotUpdateAsync(TelegramUpdate update);

    Task SendOtpCodeAsync(long chatId, string code);
}
