using System.ComponentModel.DataAnnotations;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class TelegramAuthRequest
{
    [Required]
    public long Id { get; set; }

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Username { get; set; }
    public string? PhotoUrl { get; set; }

    [Required]
    public long AuthDate { get; set; }

    [Required]
    public string Hash { get; set; } = default!;
}
