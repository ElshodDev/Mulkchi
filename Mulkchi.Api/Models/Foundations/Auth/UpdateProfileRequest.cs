using System.ComponentModel.DataAnnotations;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Auth;

public class UpdateProfileRequest
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; }

    [StringLength(100)]
    public string LastName { get; set; }

    [StringLength(100)]
    public string Bio { get; set; }

    [StringLength(255)]
    public string Address { get; set; }

    [StringLength(20)]
    public string Phone { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }

    public Gender Gender { get; set; }

    [StringLength(255)]
    public string AvatarUrl { get; set; }

    // Single Identity: Current active mode (Guest/Host)
    public UserRole? CurrentMode { get; set; }
}
