using System.Collections.Concurrent;
using System.Security.Cryptography;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Tokens;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Services.Foundations.Auth;

public class TelegramAuthService : ITelegramAuthService
{
    private readonly IStorageBroker _storageBroker;
    private readonly ITelegramBroker _telegramBroker;
    private readonly ITokenBroker _tokenBroker;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TelegramAuthService> _logger;

    private static readonly ConcurrentDictionary<string, TelegramSession> _sessions = new();

    public TelegramAuthService(
        IStorageBroker storageBroker,
        ITelegramBroker telegramBroker,
        ITokenBroker tokenBroker,
        IConfiguration configuration,
        ILogger<TelegramAuthService> logger)
    {
        _storageBroker = storageBroker;
        _telegramBroker = telegramBroker;
        _tokenBroker = tokenBroker;
        _configuration = configuration;
        _logger = logger;
    }

    public Task<TelegramInitResponse> InitiateLoginAsync()
    {
        var sessionId = GenerateSessionId();
        var code = GenerateOtpCode();
        var botUsername = _configuration["TelegramAuth:BotUsername"];

        if (string.IsNullOrWhiteSpace(botUsername))
        {
            _logger.LogError("TelegramAuth:BotUsername konfiguratsiyada topilmadi");
            throw new InvalidOperationException("Telegram bot username sozlanmagan");
        }

        var session = new TelegramSession
        {
            SessionId = sessionId,
            Code = code,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        };

        _sessions.TryAdd(sessionId, session);

        _ = Task.Run(async () =>
        {
            await Task.Delay(TimeSpan.FromMinutes(10));
            _sessions.TryRemove(sessionId, out _);
        });

        var deepLink = $"https://t.me/{botUsername}?start={sessionId}";

        _logger.LogInformation("Telegram login session yaratildi. SessionId: {SessionId}", sessionId);

        return Task.FromResult(new TelegramInitResponse
        {
            BotUsername = botUsername,
            DeepLink = deepLink,
            SessionId = sessionId,
            ExpiresAt = session.ExpiresAt
        });
    }

    public Task<TelegramSessionStatus> CheckSessionStatusAsync(string sessionId)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
        {
            return Task.FromResult(new TelegramSessionStatus
            {
                Status = "expired"
            });
        }

        if (DateTime.UtcNow > session.ExpiresAt)
        {
            _sessions.TryRemove(sessionId, out _);
            return Task.FromResult(new TelegramSessionStatus
            {
                Status = "expired"
            });
        }

        if (session.IsVerified && session.TelegramChatId.HasValue)
        {
            var user = session.User;
            if (user != null)
            {
                var accessToken = _tokenBroker.GenerateToken(user);
                var refreshToken = _tokenBroker.GenerateRefreshToken();

                return Task.FromResult(new TelegramSessionStatus
                {
                    Status = "verified",
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    User = new TelegramUserInfo
                    {
                        Id = user.Id,
                        FullName = $"{user.FirstName} {user.LastName}",
                        Username = user.Email ?? $"tg_{user.TelegramId}",
                        TelegramId = user.TelegramId!.Value
                    }
                });
            }
        }

        return Task.FromResult(new TelegramSessionStatus
        {
            Status = "pending"
        });
    }

    public async Task HandleBotUpdateAsync(TelegramUpdate update)
    {
        if (update?.Message?.Text == null)
            return;

        var text = update.Message.Text.Trim();
        var chatId = update.Message.Chat.Id;
        var telegramUser = update.Message.From;

        if (text.StartsWith("/start ", StringComparison.OrdinalIgnoreCase))
        {
            var sessionId = text.Substring(7).Trim();
            await HandleStartCommandAsync(sessionId, chatId, telegramUser);
        }
        else if (text.Equals("/start", StringComparison.OrdinalIgnoreCase))
        {
            await _telegramBroker.SendMessageAsync(chatId,
                "👋 <b>Mulkchi</b> ga xush kelibsiz!\n\n" +
                "🔑 Ro'yxatdan o'tish uchun saytdagi Telegram login tugmasini bosing.");
        }
        else
        {
            if (text.Length == 6 && text.All(char.IsDigit))
            {
                await HandleOtpCodeAsync(text, chatId);
            }
        }
    }

    private async Task HandleStartCommandAsync(string sessionId, long chatId, TelegramUser telegramUser)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
        {
            await _telegramBroker.SendMessageAsync(chatId,
                "❌ Session eskirgan. Iltimos, saytda qayta urinib ko'ring.");
            return;
        }

        var existingUser = await _storageBroker.SelectUserByTelegramIdAsync(telegramUser.Id);

        if (existingUser != null)
        {
            session.TelegramChatId = chatId;
            session.IsVerified = true;
            session.User = existingUser;

            await _telegramBroker.SendMessageAsync(chatId,
                $"✅ <b>Xush kelibsiz, {telegramUser.FirstName}!</b>\n\n" +
                "Saytga qaytishingiz mumkin.");

            _logger.LogInformation("Telegram orqali mavjud user kirdi. UserId: {UserId}, TelegramId: {TelegramId}",
                existingUser.Id, telegramUser.Id);
        }
        else
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = telegramUser.FirstName,
                LastName = telegramUser.LastName ?? string.Empty,
                Email = $"tg_{chatId}@mulkchi.uz",
                TelegramId = chatId,
                Role = UserRole.Guest,
                CurrentMode = UserRole.Guest,
                CreatedDate = DateTimeOffset.UtcNow,
                UpdatedDate = DateTimeOffset.UtcNow,
                EmailConfirmed = true
            };

            await _storageBroker.InsertUserAsync(user);

            session.TelegramChatId = chatId;
            session.IsVerified = true;
            session.User = user;

            await _telegramBroker.SendMessageAsync(chatId,
                $"✅ <b>Xush kelibsiz, {telegramUser.FirstName}!</b>\n\n" +
                "Saytga qaytishingiz mumkin.");

            _logger.LogInformation("Telegram orqali yangi user yaratildi. SessionId: {SessionId}, UserId: {UserId}",
                sessionId, user.Id);
        }
    }

    private async Task HandleOtpCodeAsync(string code, long chatId)
    {
        var session = _sessions.Values.FirstOrDefault(s =>
            s.TelegramChatId == chatId && s.Code == code && !s.IsVerified);

        if (session == null)
        {
            await _telegramBroker.SendMessageAsync(chatId,
                "❌ Noto'g'ri kod yoki session eskirgan.");
            return;
        }

        var telegramUser = new TelegramUser
        {
            Id = chatId,
            FirstName = "Telegram",
            LastName = "User"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = telegramUser.FirstName,
            LastName = telegramUser.LastName,
            Email = $"tg_{chatId}@mulkchi.uz",
            TelegramId = chatId,
            Role = UserRole.Guest,
            CurrentMode = UserRole.Guest,
            CreatedDate = DateTimeOffset.UtcNow,
            UpdatedDate = DateTimeOffset.UtcNow,
            EmailConfirmed = true
        };

        await _storageBroker.InsertUserAsync(user);

        session.IsVerified = true;
        session.User = user;

        await _telegramBroker.SendMessageAsync(chatId,
            "✅ <b>Ro'yxatdan o'tish muvaffaqiyatli!</b>\n\n" +
            "Saytga qaytishingiz mumkin.");

        _logger.LogInformation("Telegram orqali yangi user yaratildi. UserId: {UserId}", user.Id);
    }

    public Task SendOtpCodeAsync(long chatId, string code)
    {
        return _telegramBroker.SendOtpCodeAsync(chatId, code);
    }

    private static string GenerateSessionId()
    {
        var bytes = RandomNumberGenerator.GetBytes(16);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string GenerateOtpCode()
    {
        return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
    }
}