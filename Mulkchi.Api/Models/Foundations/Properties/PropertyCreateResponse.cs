using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Models.Foundations.Properties;

/// <summary>
/// Response returned when creating a new property listing.
/// Includes the created property and new authentication tokens (if user was upgraded to Host).
/// </summary>
public class PropertyCreateResponse
{
    /// <summary>
    /// The newly created property listing.
    /// </summary>
    public PropertyResponse Property { get; set; } = null!;

    /// <summary>
    /// New authentication tokens (only present if user was upgraded from Guest to Host).
    /// When present, frontend should update stored tokens to access Host-only endpoints.
    /// </summary>
    public AuthResponse? Tokens { get; set; }
}
