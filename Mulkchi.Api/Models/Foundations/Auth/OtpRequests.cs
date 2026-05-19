using System.ComponentModel.DataAnnotations;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class SendOtpRequest
{
    [Required]
    public string Phone { get; set; } = default!;
}

public class VerifyOtpRequest
{
    [Required]
    public string Phone { get; set; } = default!;

    [Required]
    public string Code { get; set; } = default!;
}
