#nullable disable

namespace Mulkchi.Api.Models.Foundations.Auth;

public class ResetPasswordRequest
{
    public string Token { get; set; }
    public string NewPassword { get; set; }
}
