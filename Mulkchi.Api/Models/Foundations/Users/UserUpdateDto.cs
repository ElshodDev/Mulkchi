using System;

namespace Mulkchi.Api.Models.Foundations.Users;

public class UserUpdateDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Bio { get; set; }
    public string? PreferredLanguage { get; set; }
}
