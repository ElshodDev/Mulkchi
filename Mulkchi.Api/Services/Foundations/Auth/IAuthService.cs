using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Services.Foundations.Auth;

public interface IAuthService
{
    ValueTask<AuthResponse> LoginAsync(LoginRequest request);
    ValueTask<AuthResponse> RegisterAsync(RegisterRequest request);
    ValueTask<AuthResponse> RefreshTokenAsync(string refreshToken);
    ValueTask LogoutAsync(string refreshToken);
    ValueTask ForgotPasswordAsync(string email);
    ValueTask ResetPasswordAsync(string token, string newPassword);
    ValueTask<User> RetrieveUserByIdAsync(Guid userId);
    ValueTask<User> ModifyUserProfileAsync(Guid userId, UpdateProfileRequest request);
    ValueTask RemoveUserByIdAsync(Guid userId);

    ValueTask VerifyEmailAsync(string token);
    ValueTask<string> SendEmailCodeAsync(string email);
    ValueTask<AuthResponse> VerifyEmailCodeAsync(string sessionId, string code);

    ValueTask SendPhoneOtpAsync(Guid userId, string phone);
    ValueTask VerifyPhoneOtpAsync(string phone, string code);

    ValueTask<AuthResponse> LoginWithGoogleAsync(string idToken);

    ValueTask<AuthResponse> LoginWithTelegramAsync(TelegramAuthRequest request);

    Task<AuthResponse> GenerateTokensForUserAsync(Guid userId);
}

