using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Models.Foundations.Properties;

public class PropertyCreateResponse
{
    public PropertyResponse Property { get; set; } = null!;

    public AuthResponse? Tokens { get; set; }
}
