#nullable disable

using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class AuthUserInfo
{
    public Guid UserId { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public UserRole CurrentMode { get; set; } 
    public DateTimeOffset ExpiresAt { get; set; }

    public string AccessToken { get; set; }

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
    }
}
