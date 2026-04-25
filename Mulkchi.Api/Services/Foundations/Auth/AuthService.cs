using System;
using System.Security.Cryptography;
using BCrypt.Net;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Notifications;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Tokens;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Microsoft.Extensions.Configuration;

namespace Mulkchi.Api.Services.Foundations.Auth;

public partial class AuthService : IAuthService
{
    /// <summary>Number of days the refresh token (and its httpOnly cookie) remain valid.</summary>
    public const int RefreshTokenExpiryDays = 30;

    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ITokenBroker tokenBroker;
    private readonly IEmailBroker emailBroker;
    private readonly ISmsBroker smsBroker;
    private readonly IConfiguration configuration;
    private readonly IHttpClientFactory httpClientFactory;

    public AuthService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ITokenBroker tokenBroker,
        IEmailBroker emailBroker,
        ISmsBroker smsBroker,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.tokenBroker = tokenBroker;
        this.emailBroker = emailBroker;
        this.smsBroker = smsBroker;
        this.configuration = configuration;
        this.httpClientFactory = httpClientFactory;
    }

    public ValueTask<AuthResponse> LoginAsync(LoginRequest request) =>
        TryCatch(async () =>
        {
            ValidateLoginRequest(request);

            User? maybeUser = await this.storageBroker.SelectUserByEmailAsync(request.Email);

            if (maybeUser is null)
                throw new NotFoundUserByEmailException(
                    message: $"User with email '{request.Email}' was not found.");

            if (string.IsNullOrWhiteSpace(request.Password))
                throw new InvalidLoginRequestException(
                    message: "Password is required.");

            if (string.IsNullOrWhiteSpace(maybeUser.PasswordHash))
                throw new InvalidLoginRequestException(
                    message: "User account is missing password credentials. Please contact support.");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, maybeUser.PasswordHash))
                throw new InvalidLoginRequestException(
                    message: "The provided credentials are invalid.");

            return await GenerateAndSaveAuthResponseAsync(maybeUser);
        });

    public ValueTask<AuthResponse> RegisterAsync(RegisterRequest request) =>
        TryCatch(async () =>
        {
            ValidateRegisterRequest(request);

            User? existingUser = await this.storageBroker.SelectUserByEmailAsync(request.Email);

            if (existingUser is not null)
                throw new AlreadyExistsUserEmailException(
                    message: $"A user with email '{request.Email}' already exists.");

            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                PreferredLanguage = request.PreferredLanguage,
                Role = UserRole.Guest,
                CreatedDate = now,
                UpdatedDate = now
            };

            User addedUser = await this.storageBroker.InsertUserAsync(user);

            // Do not block account creation when SMTP is misconfigured in development.
            try
            {
                await SendEmailVerificationAsync(addedUser);
            }
            catch (Exception exception)
            {
                this.loggingBroker.LogError(exception);
            }

            return await GenerateAndSaveAuthResponseAsync(addedUser);
        });

    public ValueTask<AuthResponse> RefreshTokenAsync(string refreshToken) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                throw new InvalidRefreshTokenException(
                    message: "Refresh token is required.");

            string hashedToken = HashToken(refreshToken);

            UserRefreshToken? storedToken =
                await this.storageBroker.SelectRefreshTokenAsync(hashedToken);

            if (storedToken is null || storedToken.IsRevoked)
                throw new InvalidRefreshTokenException(
                    message: "Refresh token is invalid or has been revoked.");

            if (storedToken.ExpiresAt <= this.dateTimeBroker.GetCurrentDateTimeOffset())
                throw new InvalidRefreshTokenException(
                    message: "Refresh token is invalid or expired.");

            User? maybeUser = await this.storageBroker.SelectUserByIdAsync(storedToken.UserId);

            if (maybeUser is null)
                throw new InvalidRefreshTokenException(
                    message: "Refresh token references a user that no longer exists.");

            storedToken.IsRevoked = true;
            await this.storageBroker.UpdateRefreshTokenAsync(storedToken);

            return await GenerateAndSaveAuthResponseAsync(maybeUser);
        });

    public ValueTask LogoutAsync(string refreshToken) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                throw new InvalidRefreshTokenException(
                    message: "Refresh token is required.");

            string hashedToken = HashToken(refreshToken);

            UserRefreshToken? storedToken =
                await this.storageBroker.SelectRefreshTokenAsync(hashedToken);

            if (storedToken is not null && !storedToken.IsRevoked)
            {
                storedToken.IsRevoked = true;
                await this.storageBroker.UpdateRefreshTokenAsync(storedToken);
            }
        });

    private async Task<AuthResponse> GenerateAndSaveAuthResponseAsync(User user)
    {
        DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        DateTimeOffset expiresAt = now.AddMinutes(15);

        string accessToken = this.tokenBroker.GenerateToken(user);
        string rawRefreshToken = this.tokenBroker.GenerateRefreshToken();
        string hashedRefreshToken = HashToken(rawRefreshToken);

        DateTimeOffset refreshExpiresAt = now.AddDays(RefreshTokenExpiryDays);

        var userRefreshToken = new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            Token = hashedRefreshToken,
            UserId = user.Id,
            ExpiresAt = refreshExpiresAt,
            IsRevoked = false,
            CreatedDate = now
        };

        await this.storageBroker.InsertRefreshTokenAsync(userRefreshToken);

        return new AuthResponse
        {
            Token = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresAt = expiresAt,
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role
        };
    }

    public ValueTask ForgotPasswordAsync(string email) =>
        TryCatch(async () =>
        {
            ValidateEmail(email);

            User? user = await this.storageBroker.SelectUserByEmailAsync(email);
            
            // Always return success to prevent email enumeration
            if (user is null)
                return;

            // Generate secure token
            string rawToken = GenerateSecureResetToken();
            string hashedToken = HashToken(rawToken);
            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            DateTimeOffset expiresAt = now.AddHours(1);

            var passwordResetToken = new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = hashedToken,
                ExpiresAt = expiresAt,
                IsUsed = false,
                CreatedDate = now
            };

            await this.storageBroker.InsertPasswordResetTokenAsync(passwordResetToken);

            // Send email with raw token (never the hash)
            await SendPasswordResetEmailAsync(user.Email, rawToken);
        });

    public ValueTask ResetPasswordAsync(string token, string newPassword) =>
        TryCatch(async () =>
        {
            ValidateResetPasswordRequest(token, newPassword);

            string hashedToken = HashToken(token);
            PasswordResetToken? resetToken = await this.storageBroker.SelectPasswordResetTokenByTokenAsync(hashedToken);

            if (resetToken is null)
                throw new NotFoundPasswordResetTokenException();

            if (resetToken.IsUsed || resetToken.ExpiresAt < this.dateTimeBroker.GetCurrentDateTimeOffset())
                throw new NotFoundPasswordResetTokenException();

            User? user = await this.storageBroker.SelectUserByIdAsync(resetToken.UserId);

            if (user is null)
                throw new NotFoundUserByEmailException(
                    message: $"User with ID '{resetToken.UserId}' was not found.");

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

            await this.storageBroker.UpdateUserAsync(user);

            // Mark token as used
            resetToken.IsUsed = true;
            await this.storageBroker.UpdatePasswordResetTokenAsync(resetToken);
        });

    private static string GenerateSecureResetToken()
    {
        var randomBytes = new byte[32];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Trim('=');
    }

    /// <summary>
    /// Computes a SHA-256 hex digest of a raw token value.
    /// Store only the hash in the database; compare hashes on lookup.
    /// </summary>
    private static string HashToken(string rawToken)
    {
        byte[] bytes = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private async Task SendPasswordResetEmailAsync(string email, string token)
    {
        var frontendUrl = this.configuration["AppSettings:FrontendUrl"] ?? "https://mulkchi.uz";
        var resetUrl = $"{frontendUrl}/reset-password?token={token}";

        await this.emailBroker.SendEmailAsync(
            email,
            "Parolni tiklash so'rovi / Password Reset Request",
            $"<h2>Parolni tiklash</h2>" +
            $"<p>Parolni tiklash uchun quyidagi havolani bosing:</p>" +
            $"<p><a href='{resetUrl}'>Parolni tiklash</a></p>" +
            $"<p>Bu havola 1 soat davomida amal qiladi.</p>" +
            $"<hr/>" +
            $"<p>If you did not request a password reset, please ignore this email.</p>");
    }

    private static void ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidAuthException("Email is required.");

        if (!email.Contains("@"))
            throw new InvalidAuthException("Invalid email format.");
    }

    private static void ValidateResetPasswordRequest(string token, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new InvalidAuthException("Reset token is required.");

        if (string.IsNullOrWhiteSpace(newPassword))
            throw new InvalidAuthException("New password is required.");

        if (newPassword.Length < 8)
            throw new InvalidAuthException("Password must be at least 8 characters long.");

        if (!System.Text.RegularExpressions.Regex.IsMatch(
                newPassword,
                @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$"))
            throw new InvalidAuthException(
                "Password must contain uppercase, lowercase, digit, and special character.");
    }

    private static string GenerateSecureRefreshToken()
    {
        var randomBytes = new byte[64];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public async ValueTask<User> RetrieveUserByIdAsync(Guid userId)
    {
        ValidateUserId(userId);

        var storageUser = await this.storageBroker.SelectUserByIdAsync(userId);
        
        if (storageUser is null)
            throw new NotFoundUserException(userId);

        return storageUser;
    }

    public async ValueTask<User> ModifyUserProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        ValidateUserId(userId);
        ValidateUpdateProfileRequest(request);

        var storageUser = await this.storageBroker.SelectUserByIdAsync(userId);
        
        if (storageUser is null)
            throw new NotFoundUserException(userId);

        // Update user properties
        storageUser.FirstName = request.FirstName;
        storageUser.LastName = request.LastName;
        storageUser.Bio = request.Bio;
        storageUser.Address = request.Address;
        storageUser.Phone = request.Phone;
        storageUser.DateOfBirth = request.DateOfBirth;
        storageUser.Gender = request.Gender;
        storageUser.AvatarUrl = request.AvatarUrl;
        storageUser.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

        var updatedUser = await this.storageBroker.UpdateUserAsync(storageUser);
        
        return updatedUser;
    }

    public async ValueTask RemoveUserByIdAsync(Guid userId)
    {
        ValidateUserId(userId);

        var storageUser = await this.storageBroker.SelectUserByIdAsync(userId);
        
        if (storageUser is null)
            throw new NotFoundUserException(userId);

        // Soft delete user
        storageUser.DeletedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        storageUser.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

        await this.storageBroker.UpdateUserAsync(storageUser);
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new InvalidAuthException("User ID is required.");
    }

    private static void ValidateUpdateProfileRequest(UpdateProfileRequest request)
    {
        if (request == null)
            throw new InvalidAuthException("Update profile request is required.");
    }

    // ─── Email Verification ──────────────────────────────────────────────────

    public ValueTask VerifyEmailAsync(string token) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidAuthException("Verification token is required.");

            string hashedToken = HashToken(token);
            EmailVerificationToken? verificationToken =
                await this.storageBroker.SelectEmailVerificationTokenByTokenAsync(hashedToken);

            if (verificationToken is null)
                throw new InvalidAuthException("Invalid or expired verification token.");

            User? user = await this.storageBroker.SelectUserByIdAsync(verificationToken.UserId);

            if (user is null)
                throw new InvalidAuthException("User associated with this token no longer exists.");

            user.EmailConfirmed = true;
            user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            await this.storageBroker.UpdateUserAsync(user);

            verificationToken.IsUsed = true;
            await this.storageBroker.UpdateEmailVerificationTokenAsync(verificationToken);
        });

    private async Task SendEmailVerificationAsync(User user)
    {
        string rawToken = GenerateSecureResetToken();
        string hashedToken = HashToken(rawToken);
        DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = hashedToken,
            ExpiresAt = now.AddHours(24),
            IsUsed = false,
            CreatedDate = now
        };

        await this.storageBroker.InsertEmailVerificationTokenAsync(verificationToken);

        var frontendUrl = this.configuration["AppSettings:FrontendUrl"] ?? "https://mulkchi.uz";
        var verifyUrl = $"{frontendUrl}/verify-email?token={rawToken}";

        await this.emailBroker.SendEmailAsync(
            user.Email,
            "Email manzilingizni tasdiqlang / Verify Your Email",
            $"<h2>Email tasdiqlash</h2>" +
            $"<p>Salom, {user.FirstName}!</p>" +
            $"<p>Email manzilingizni tasdiqlash uchun quyidagi havolani bosing:</p>" +
            $"<p><a href='{verifyUrl}'>Email tasdiqlash</a></p>" +
            $"<p>Bu havola 24 soat davomida amal qiladi.</p>" +
            $"<hr/>" +
            $"<p>If you did not create an account, please ignore this email.</p>");
    }

    // ─── Phone OTP ───────────────────────────────────────────────────────────

    public ValueTask SendPhoneOtpAsync(Guid userId, string phone) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(phone))
                throw new InvalidAuthException("Phone number is required.");

            string code = GenerateOtpCode();
            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

            var otp = new PhoneOtp
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Phone = phone,
                Code = HashToken(code),
                ExpiresAt = now.AddMinutes(5),
                IsUsed = false,
                CreatedDate = now
            };

            await this.storageBroker.InsertPhoneOtpAsync(otp);

            await this.smsBroker.SendSmsAsync(
                phone,
                $"Mulkchi: Sizning tasdiqlash kodingiz: {code}. Kod 5 daqiqa davomida amal qiladi.");
        });

    public ValueTask VerifyPhoneOtpAsync(string phone, string code) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(phone))
                throw new InvalidAuthException("Phone number is required.");

            if (string.IsNullOrWhiteSpace(code))
                throw new InvalidAuthException("OTP code is required.");

            PhoneOtp? otp = await this.storageBroker.SelectLatestActivePhoneOtpAsync(phone);

            if (otp is null || otp.Code != HashToken(code))
                throw new InvalidAuthException("Invalid or expired OTP code.");

            User? user = await this.storageBroker.SelectUserByIdAsync(otp.UserId);

            if (user is null)
                throw new InvalidAuthException("User associated with this OTP no longer exists.");

            user.IsVerified = true;
            user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            await this.storageBroker.UpdateUserAsync(user);

            otp.IsUsed = true;
            await this.storageBroker.UpdatePhoneOtpAsync(otp);
        });

    private static string GenerateOtpCode()
    {
        // Use cryptographically secure random number generation
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        int value = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 900000 + 100000;
        return value.ToString();
    }

    // ─── Google OAuth ────────────────────────────────────────────────────────

    public ValueTask<AuthResponse> LoginWithGoogleAsync(string idToken) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(idToken))
                throw new InvalidAuthException("Google ID token is required.");

            // Validate the Google ID token via Google's tokeninfo endpoint
            using var httpClient = this.httpClientFactory.CreateClient("google");
            var response = await httpClient.GetAsync(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}");

            if (!response.IsSuccessStatusCode)
                throw new InvalidAuthException("Invalid Google ID token.");

            var json = await response.Content.ReadAsStringAsync();
            var payload = System.Text.Json.JsonDocument.Parse(json).RootElement;

            string? email = payload.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
            string? firstName = payload.TryGetProperty("given_name", out var fnProp) ? fnProp.GetString() : null;
            string? lastName = payload.TryGetProperty("family_name", out var lnProp) ? lnProp.GetString() : null;
            string? picture = payload.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;
            bool emailVerified = payload.TryGetProperty("email_verified", out var evProp)
                && (evProp.GetString() == "true" || evProp.ValueKind == System.Text.Json.JsonValueKind.True);

            if (string.IsNullOrWhiteSpace(email))
                throw new InvalidAuthException("Google account does not provide an email address.");

            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

            User? existingUser = await this.storageBroker.SelectUserByEmailAsync(email);

            User user;
            if (existingUser is not null)
            {
                user = existingUser;
            }
            else
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FirstName = firstName ?? email,
                    LastName = lastName ?? string.Empty,
                    Email = email,
                    Phone = string.Empty,
                    AvatarUrl = picture,
                    EmailConfirmed = emailVerified,
                    Role = UserRole.Guest,
                    CreatedDate = now,
                    UpdatedDate = now
                };

                user = await this.storageBroker.InsertUserAsync(user);
            }

            return await GenerateAndSaveAuthResponseAsync(user);
        });

    // ─── Telegram Auth ───────────────────────────────────────────────────────

    public ValueTask<AuthResponse> LoginWithTelegramAsync(TelegramAuthRequest request) =>
        TryCatch(async () =>
        {
            if (request is null)
                throw new InvalidAuthException("Telegram auth request is required.");

            VerifyTelegramData(request);

            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

            // Build a pseudo-email for Telegram users (no real email)
            string pseudoEmail = $"telegram_{request.Id}@mulkchi.telegram";

            User? existingUser = await this.storageBroker.SelectUserByEmailAsync(pseudoEmail);

            User user;
            if (existingUser is not null)
            {
                user = existingUser;
            }
            else
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FirstName = request.FirstName ?? $"Telegram{request.Id}",
                    LastName = request.LastName ?? string.Empty,
                    Email = pseudoEmail,
                    Phone = string.Empty,
                    AvatarUrl = request.PhotoUrl,
                    EmailConfirmed = false,
                    Role = UserRole.Guest,
                    CreatedDate = now,
                    UpdatedDate = now
                };

                user = await this.storageBroker.InsertUserAsync(user);
            }

            return await GenerateAndSaveAuthResponseAsync(user);
        });

    private void VerifyTelegramData(TelegramAuthRequest request)
    {
        var botToken = this.configuration["TelegramAuth:BotToken"];

        if (string.IsNullOrWhiteSpace(botToken))
            throw new InvalidOperationException("TelegramAuth:BotToken is not configured.");

        // The auth_date must be recent (within 1 hour)
        var authDate = DateTimeOffset.FromUnixTimeSeconds(request.AuthDate);
        if (DateTimeOffset.UtcNow - authDate > TimeSpan.FromHours(1))
            throw new InvalidAuthException("Telegram auth data has expired.");

        // Build the data check string (sorted key=value pairs, excluding hash)
        var dataFields = new System.Collections.Generic.SortedDictionary<string, string>
        {
            ["auth_date"] = request.AuthDate.ToString(),
            ["id"] = request.Id.ToString()
        };

        if (!string.IsNullOrEmpty(request.FirstName))
            dataFields["first_name"] = request.FirstName;
        if (!string.IsNullOrEmpty(request.LastName))
            dataFields["last_name"] = request.LastName;
        if (!string.IsNullOrEmpty(request.Username))
            dataFields["username"] = request.Username;
        if (!string.IsNullOrEmpty(request.PhotoUrl))
            dataFields["photo_url"] = request.PhotoUrl;

        string dataCheckString = string.Join("\n", dataFields.Select(kv => $"{kv.Key}={kv.Value}"));

        // secret_key = SHA256(bot_token)
        byte[] secretKey = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(botToken));

        // expected_hash = HMAC-SHA256(dataCheckString, secretKey)
        using var hmac = new System.Security.Cryptography.HMACSHA256(secretKey);
        byte[] computedHashBytes = hmac.ComputeHash(
            System.Text.Encoding.UTF8.GetBytes(dataCheckString));
        string computedHash = Convert.ToHexString(computedHashBytes).ToLowerInvariant();

        if (!computedHash.Equals(request.Hash, StringComparison.OrdinalIgnoreCase))
            throw new InvalidAuthException("Telegram auth data verification failed.");
    }
}
