#nullable disable

namespace Mulkchi.Api.Models.Foundations.Auth;

public class PasswordResetToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
