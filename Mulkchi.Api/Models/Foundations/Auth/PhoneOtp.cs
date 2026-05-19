#nullable disable

namespace Mulkchi.Api.Models.Foundations.Auth;

public class PhoneOtp
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Phone { get; set; }
    public string Code { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
