using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Services.Foundations.Users;

public interface IUserService
{
    ValueTask<User> AddUserAsync(User user);
    IQueryable<User> RetrieveAllUsers();
    ValueTask<UserResponse> RetrieveCurrentUserAsync();
    ValueTask<UserResponse> ModifyUserProfileAsync(UserUpdateDto dto);
    ValueTask<UserResponse> ModifyUserAvatarAsync(IFormFile avatarFile);
    ValueTask<UserResponse> RetrieveUserByIdAsync(Guid userId);
    ValueTask<IEnumerable<UserResponse>> RetrieveAllUsersAsync();
    ValueTask<User> ModifyUserAsync(User user);
    ValueTask<User> RemoveUserByIdAsync(Guid userId);

    ValueTask<User> UpgradeToHostAsync(Guid userId);
    ValueTask<UserResponse> VerifyHostWithOneIdAsync(string authCode);
}
