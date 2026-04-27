#nullable disable

using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Auth;

/// <summary>
/// Returned in the HTTP response body after login / register / refresh.
/// Does NOT contain tokens — those are delivered via httpOnly cookies.
/// The <see cref="AccessToken"/> field is included solely for in-memory
/// use by the SignalR client (accessTokenFactory); it must never be
/// written to persistent storage (localStorage / sessionStorage).
/// </summary>
public class AuthUserInfo
{
    public Guid UserId { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public UserRole CurrentMode { get; set; }  // Current active mode for Single Identity
    public DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// Short-lived JWT for SignalR WebSocket authentication.
    /// Store only in memory — never in localStorage or sessionStorage.
    /// </summary>
    public string AccessToken { get; set; }

    /// <summary>
    /// Refresh token for obtaining new access tokens.
    /// Frontend stores this in localStorage for session management.
    /// </summary>
    public string RefreshToken { get; set; }

    public AuthUserInfo() { }

    public AuthUserInfo(AuthResponse response)
    {
        UserId = response.UserId;
        Email = response.Email;
        FirstName = response.FirstName;
        LastName = response.LastName;
        AvatarUrl = response.AvatarUrl;
        Role = response.Role;
        CurrentMode = response.CurrentMode;
        ExpiresAt = response.ExpiresAt;
        AccessToken = response.Token;
        RefreshToken = response.RefreshToken;
    }
}
