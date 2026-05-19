using System;

namespace Mulkchi.Api.Models.Foundations.Users;

public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    
    // Optional metrics
    public int PropertiesCount { get; set; }
    public decimal AverageRating { get; set; }
    public string? PreferredLanguage { get; set; }
}
