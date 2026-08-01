using System.Collections.Concurrent;
using System.Security.Cryptography;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Tokens;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Services.Foundations.Auth;

public class TelegramAuthService : ITelegramAuthService
{
    private const int SessionExpiryMinutes = 10;
    private const string PendingStatus = "pending";
    private const string VerifiedStatus = "verified";
    private const string ExpiredStatus = "expired";

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
            ExpiresAt = DateTime.UtcNow.AddMinutes(SessionExpiryMinutes)
        };

        _sessions.TryAdd(sessionId, session);

        _ = Task.Run(async () =>
        {
            await Task.Delay(TimeSpan.FromMinutes(SessionExpiryMinutes));
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
            return Task.FromResult(CreateStatus(ExpiredStatus));

        if (DateTime.UtcNow > session.ExpiresAt)
        {
            _sessions.TryRemove(sessionId, out _);
            return Task.FromResult(CreateStatus(ExpiredStatus));
        }

        if (session.IsVerified && session.TelegramChatId.HasValue)
        {
            var user = session.User;
            if (user != null)
            {
                return Task.FromResult(CreateVerifiedStatus(user));
            }
        }

        return Task.FromResult(CreateStatus(PendingStatus));
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
            await SendSessionExpiredMessageAsync(chatId);
            return;
        }

        var existingUser = await _storageBroker.SelectUserByTelegramIdAsync(telegramUser.Id);

        if (existingUser != null)
        {
            CompleteSession(session, chatId, existingUser);
            await SendWelcomeMessageAsync(chatId, telegramUser.FirstName);

            _logger.LogInformation("Telegram orqali mavjud user kirdi. UserId: {UserId}, TelegramId: {TelegramId}",
                existingUser.Id, telegramUser.Id);
        }
        else
        {
            var user = CreateTelegramGuestUser(chatId, telegramUser.FirstName, telegramUser.LastName ?? string.Empty);

            await _storageBroker.InsertUserAsync(user);

            CompleteSession(session, chatId, user);
            await SendWelcomeMessageAsync(chatId, telegramUser.FirstName);

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
            await _telegramBroker.SendMessageAsync(chatId, "❌ Noto'g'ri kod yoki session eskirgan.");
            return;
        }

        var user = CreateTelegramGuestUser(chatId, "Telegram", "User");

        await _storageBroker.InsertUserAsync(user);

        CompleteSession(session, chatId, user);

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

    private TelegramSessionStatus CreateVerifiedStatus(User user) =>
        new()
        {
            Status = VerifiedStatus,
            AccessToken = _tokenBroker.GenerateToken(user),
            RefreshToken = _tokenBroker.GenerateRefreshToken(),
            User = new TelegramUserInfo
            {
                Id = user.Id,
                FullName = $"{user.FirstName} {user.LastName}".Trim(),
                Username = user.Email ?? $"tg_{user.TelegramId}",
                TelegramId = user.TelegramId!.Value
            }
        };

    private static TelegramSessionStatus CreateStatus(string status) => new() { Status = status };

    private static User CreateTelegramGuestUser(long chatId, string firstName, string lastName) =>
        new()
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            Email = $"tg_{chatId}@mulkchi.uz",
            TelegramId = chatId,
            Role = UserRole.Guest,
            CurrentMode = UserRole.Guest,
            CreatedDate = DateTimeOffset.UtcNow,
            UpdatedDate = DateTimeOffset.UtcNow,
            EmailConfirmed = true
        };

    private static void CompleteSession(TelegramSession session, long chatId, User user)
    {
        session.TelegramChatId = chatId;
        session.IsVerified = true;
        session.User = user;
    }

    private Task SendWelcomeMessageAsync(long chatId, string firstName) =>
        _telegramBroker.SendMessageAsync(
            chatId,
            $"✅ <b>Xush kelibsiz, {firstName}!</b>\n\nSaytga qaytishingiz mumkin.");

    private Task SendSessionExpiredMessageAsync(long chatId) =>
        _telegramBroker.SendMessageAsync(chatId, "❌ Session eskirgan. Iltimos, saytda qayta urinib ko'ring.");
}