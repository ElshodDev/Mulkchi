#nullable disable

using System.Text.Json.Serialization;

namespace Mulkchi.Api.Models.Foundations.Users;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    [JsonIgnore]
    public string PasswordHash { get; set; }
    public string AvatarUrl { get; set; }
    public string Bio { get; set; }
    public string Address { get; set; }
    public DateTimeOffset? DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public bool IsVerified { get; set; }
    public bool EmailConfirmed { get; set; }
    public UserRole Role { get; set; }
    public UserRole CurrentMode { get; set; }  // For Single Identity: Guest/Host switch
    public HostBadge Badge { get; set; }
    public decimal Rating { get; set; }
    public decimal ResponseRate { get; set; }
    public int ResponseTimeMinutes { get; set; }
    public int TotalListings { get; set; }
    public int TotalBookings { get; set; }
    public int TotalPropertiesListed { get; set; }  // Track host activity
    public DateTimeOffset? HostSince { get; set; }
    public DateTimeOffset? ModeSwitchedAt { get; set; }  // Last mode switch timestamp
    public long? TelegramId { get; set; }
    public string PreferredLanguage { get; set; } // "uz", "ru", "en"
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
