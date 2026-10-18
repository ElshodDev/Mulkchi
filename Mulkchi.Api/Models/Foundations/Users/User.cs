using System;
using System.Text.Json.Serialization;

namespace Mulkchi.Api.Models.Foundations.Users;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string? Address { get; set; }
    public DateTimeOffset? DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public bool IsVerified { get; set; }
    public bool EmailConfirmed { get; set; }
    public UserRole Role { get; set; }
    public UserRole CurrentMode { get; set; } 
    public HostBadge Badge { get; set; }
    public decimal Rating { get; set; }
    public decimal ResponseRate { get; set; }
    public int ResponseTimeMinutes { get; set; }
    public int TotalListings { get; set; }
    public int TotalBookings { get; set; }
    public int TotalPropertiesListed { get; set; } 
    public DateTimeOffset? HostSince { get; set; }
    public DateTimeOffset? ModeSwitchedAt { get; set; } 
    public long? TelegramId { get; set; }
    public string? PreferredLanguage { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
