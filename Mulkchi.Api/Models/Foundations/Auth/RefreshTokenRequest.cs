#nullable disable

namespace Mulkchi.Api.Models.Foundations.Auth;

/// <summary>
/// Legacy request body for clients that have not yet migrated to cookie-based auth.
/// </summary>
public class RefreshTokenRequest
{
    public string RefreshToken { get; set; }
}
