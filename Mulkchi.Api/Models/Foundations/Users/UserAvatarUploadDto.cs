using Microsoft.AspNetCore.Http;

namespace Mulkchi.Api.Models.Foundations.Users;

public class UserAvatarUploadDto
{
    public IFormFile AvatarFile { get; set; } = null!;
}
