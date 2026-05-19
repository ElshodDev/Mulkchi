using System.ComponentModel.DataAnnotations;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class GoogleLoginRequest
{
    [Required]
    public string IdToken { get; set; } = default!;
}
