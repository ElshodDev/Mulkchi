using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class TelegramLoginRequest
{
    public long TelegramChatId { get; set; } 
    public string Code { get; set; }          
}

public class TelegramInitResponse
{
    public string BotUsername { get; set; }   
    public string DeepLink { get; set; }      
    public string SessionId { get; set; }     
    public DateTime ExpiresAt { get; set; }
}

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

public class TelegramSession
{
    public string SessionId { get; set; } = string.Empty;
    public long? TelegramChatId { get; set; }
    public string Code { get; set; } = string.Empty;           
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public User? User { get; set; } 
}

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

public class TelegramSessionStatus
{
    public string Status { get; set; } 
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public TelegramUserInfo User { get; set; }
}