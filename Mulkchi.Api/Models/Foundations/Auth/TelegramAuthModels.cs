using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Auth;

// Foydalanuvchi Telegram orqali kirish so'rovi
public class TelegramLoginRequest
{
    public long TelegramChatId { get; set; }  // Telegram chat ID (bot dan olinadi)
    public string Code { get; set; }           // 6 xonali OTP kod
}

// Bot /start bosganida frontend ga qaytariladigan ma'lumot
public class TelegramInitResponse
{
    public string BotUsername { get; set; }    // @Mulkchi_bot
    public string DeepLink { get; set; }       // https://t.me/Mulkchi_bot?start=SESSION_ID
    public string SessionId { get; set; }      // Bir martalik session ID
    public DateTime ExpiresAt { get; set; }
}

// Bot webhook dan kelgan update (foydalanuvchi /start bosdi)
public class TelegramUpdate
{
    public long UpdateId { get; set; }
    public TelegramMessage Message { get; set; }
}

public class TelegramMessage
{
    public long MessageId { get; set; }
    public TelegramUser From { get; set; }
    public TelegramChat Chat { get; set; }
    public string Text { get; set; }
    public DateTime Date { get; set; }
}

public class TelegramUser
{
    public long Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Username { get; set; }
}

public class TelegramChat
{
    public long Id { get; set; }
}

// Telegram orqali ro'yxatdan o'tgan foydalanuvchi session
public class TelegramSession
{
    public string SessionId { get; set; } = string.Empty;
    public long? TelegramChatId { get; set; }
    public string Code { get; set; } = string.Empty;            // 6 xonali OTP
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public User? User { get; set; }  // Tasdiqlangan user
}

// Auth muvaffaqiyatli bo'lganda qaytariladigan javob
public class TelegramAuthResponse
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public TelegramUserInfo User { get; set; }
    public bool IsNewUser { get; set; }
}

public class TelegramUserInfo
{
    public Guid Id { get; set; }
    public string FullName { get; set; }
    public string Username { get; set; }
    public long TelegramId { get; set; }
}

// Frontend polling uchun — bot kodni yubordimi?
public class TelegramSessionStatus
{
    public string Status { get; set; }  // "pending" | "verified" | "expired"
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public TelegramUserInfo User { get; set; }
}