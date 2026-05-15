namespace Mulkchi.Api.Models.Foundations.Auth;

public class EmailAuthRequest
{
    public string Email { get; set; } = string.Empty;
}

public class EmailVerifyRequest
{
    public string Email { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class EmailAuthSession
{
    public string SessionId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class EmailSessionStatus
{
    public string Status { get; set; } = string.Empty; // "pending", "verified", "expired"
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public bool IsNewUser { get; set; }
}
