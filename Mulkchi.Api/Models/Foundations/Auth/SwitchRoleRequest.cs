#nullable disable

using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class SwitchRoleRequest
{
    public UserRole TargetMode { get; set; }

    public string RefreshToken { get; set; } = string.Empty;
}
