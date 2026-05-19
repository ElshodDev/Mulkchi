#nullable disable

using System.ComponentModel.DataAnnotations;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class LoginRequest
{
    [Required(ErrorMessage = "Email talab qilinadi")]
    [EmailAddress(ErrorMessage = "Email noto'g'ri formatda")]
    public string Email { get; set; }

    [Required(ErrorMessage = "Parol talab qilinadi")]
    public string Password { get; set; }
}
