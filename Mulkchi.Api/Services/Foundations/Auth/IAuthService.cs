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

    // Email verification
    ValueTask VerifyEmailAsync(string token);

    // Phone OTP
    ValueTask SendPhoneOtpAsync(Guid userId, string phone);
    ValueTask VerifyPhoneOtpAsync(string phone, string code);

    // Google OAuth
    ValueTask<AuthResponse> LoginWithGoogleAsync(string idToken);

    // Telegram auth
    ValueTask<AuthResponse> LoginWithTelegramAsync(TelegramAuthRequest request);

    /// <summary>
    /// Generates new JWT and refresh tokens for a user.
    /// Used when user role is upgraded (e.g., Guest -> Host) to issue new tokens with updated claims.
    /// </summary>
    Task<AuthResponse> GenerateTokensForUserAsync(Guid userId);
}

