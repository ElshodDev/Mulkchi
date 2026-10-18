using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Brokers.OneId;

namespace Mulkchi.Api.Services.Foundations.Users;

public partial class UserService : IUserService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ICurrentUserService currentUserService;
    private readonly IFileStorageBroker fileStorageBroker;
    private readonly IOneIdBroker oneIdBroker;

    public UserService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ICurrentUserService currentUserService,
        IFileStorageBroker fileStorageBroker,
        IOneIdBroker oneIdBroker)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.currentUserService = currentUserService;
        this.fileStorageBroker = fileStorageBroker;
        this.oneIdBroker = oneIdBroker;
    }

    public ValueTask<User> AddUserAsync(User user) =>
        TryCatch(async () =>
        {
            ValidateUserOnAdd(user);
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            user.CreatedDate = now;
            user.UpdatedDate = now;
            return await this.storageBroker.InsertUserAsync(user);
        });

    public IQueryable<User> RetrieveAllUsers() =>
        TryCatch(() => this.storageBroker.SelectAllUsers());

    public async ValueTask<IEnumerable<UserResponse>> RetrieveAllUsersAsync()
    {
        var users = await this.storageBroker.SelectAllUsers().ToListAsync();
        return users.Select(MapToUserResponse);
    }

    async ValueTask<UserResponse> IUserService.RetrieveUserByIdAsync(Guid userId)
    {
        ValidateUserId(userId);
        User maybeUser = await this.storageBroker.SelectUserByIdAsync(userId);
        if (maybeUser is null)
            throw new NotFoundUserException(userId);

        return MapToUserResponse(maybeUser);
    }

    public async ValueTask<UserResponse> RetrieveCurrentUserAsync()
    {
        Guid? userId = this.currentUserService.GetCurrentUserId();
        if (userId is null) throw new InvalidUserException("User not authenticated.");

        User maybeUser = await this.storageBroker.SelectUserByIdAsync(userId.Value);

        if (maybeUser is null)
            throw new NotFoundUserException(userId.Value);

        return MapToUserResponse(maybeUser);
    }

    public async ValueTask<UserResponse> ModifyUserProfileAsync(UserUpdateDto dto)
    {
        Guid? userId = this.currentUserService.GetCurrentUserId();
        if (userId is null) throw new InvalidUserException("User not authenticated.");

        User user = await this.storageBroker.SelectUserByIdAsync(userId.Value);

        if (user is null)
            throw new NotFoundUserException(userId.Value);

        user.FirstName = string.IsNullOrWhiteSpace(dto.FirstName) ? user.FirstName : dto.FirstName;
        user.LastName = string.IsNullOrWhiteSpace(dto.LastName) ? user.LastName : dto.LastName;
        user.Phone = dto.PhoneNumber ?? user.Phone;
        user.Bio = dto.Bio ?? user.Bio;
        user.PreferredLanguage = dto.PreferredLanguage ?? user.PreferredLanguage;

        user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        User updatedUser = await this.storageBroker.UpdateUserAsync(user);

        return MapToUserResponse(updatedUser);
    }

    public async ValueTask<UserResponse> ModifyUserAvatarAsync(IFormFile avatarFile)
    {
        ValidateAvatar(avatarFile);

        Guid? userId = this.currentUserService.GetCurrentUserId();
        if (userId is null) throw new InvalidUserException("User not authenticated.");

        User user = await this.storageBroker.SelectUserByIdAsync(userId.Value);

        if (user is null)
            throw new NotFoundUserException(userId.Value);

        string? oldAvatar = user.AvatarUrl;

        string avatarUrl = await this.fileStorageBroker.UploadFileAsync(avatarFile, "avatars");

        user.AvatarUrl = avatarUrl;
        user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

        User updatedUser = await this.storageBroker.UpdateUserAsync(user);

        if (!string.IsNullOrWhiteSpace(oldAvatar))
        {
            await this.fileStorageBroker.DeleteFileAsync(oldAvatar);
        }

        return MapToUserResponse(updatedUser);
    }

    public ValueTask<User> ModifyUserAsync(User user) =>
        TryCatch(async () =>
        {
            ValidateUserOnModify(user);
            user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            return await this.storageBroker.UpdateUserAsync(user);
        });

    public ValueTask<User> RemoveUserByIdAsync(Guid userId) =>
        TryCatch(async () =>
        {
            ValidateUserId(userId);
            return await this.storageBroker.DeleteUserByIdAsync(userId);
        });

    public async ValueTask<User> UpgradeToHostAsync(Guid userId)
    {
        ValidateUserId(userId);

        User user = await this.storageBroker.SelectUserByIdAsync(userId);
        if (user is null)
            throw new NotFoundUserException(userId);

        if (user.Role == UserRole.Host || user.Role == UserRole.Admin || user.Role == UserRole.SuperAdmin)
        {
            return user;
        }

        user.Role = UserRole.Host;
        user.CurrentMode = UserRole.Host;

        if (user.HostSince is null)
        {
            user.HostSince = this.dateTimeBroker.GetCurrentDateTimeOffset();
        }

        user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        User upgradedUser = await this.storageBroker.UpdateUserAsync(user);

        this.loggingBroker.LogInformation($"User {user.Email} (ID: {userId}) auto-upgraded to Host role.");

        return upgradedUser;
    }

    public async ValueTask<UserResponse> VerifyHostWithOneIdAsync(string authCode)
    {
        Guid? userId = this.currentUserService.GetCurrentUserId();
        if (userId is null) throw new InvalidUserException("User not authenticated.");

        User user = await this.storageBroker.SelectUserByIdAsync(userId.Value);
        if (user is null) throw new NotFoundUserException(userId.Value);

        var userInfo = await this.oneIdBroker.GetUserInfoAsync(authCode);
        if (userInfo is null) throw new InvalidUserException("Invalid OneID code.");

        // Real system would compare OneId information with user inputs here
        // For now, we just mock the verification
        user.IsVerified = true;
        user.Role = UserRole.Host;
        user.CurrentMode = UserRole.Host;
        if (user.HostSince is null)
        {
            user.HostSince = this.dateTimeBroker.GetCurrentDateTimeOffset();
        }

        user.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        User updatedUser = await this.storageBroker.UpdateUserAsync(user);

        return MapToUserResponse(updatedUser);
    }

    private void ValidateAvatar(IFormFile file)
    {
        if (file is null || file.Length == 0)
            throw new InvalidUserException("Avatar file is required.");

        if (file.Length > 5 * 1024 * 1024)
            throw new InvalidUserException("Avatar max size is 5MB.");

        string extension = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".jpg" && extension != ".jpeg" && extension != ".png" && extension != ".webp")
            throw new InvalidUserException("Invalid image format.");
    }

    private static UserResponse MapToUserResponse(User u)
    {
        return new UserResponse
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            PhoneNumber = u.Phone,
            AvatarUrl = u.AvatarUrl,
            Bio = u.Bio,
            Role = u.Role.ToString(),
            IsVerified = u.IsVerified,
            CreatedDate = u.CreatedDate,
            PropertiesCount = u.TotalListings,
            AverageRating = u.Rating,
            PreferredLanguage = u.PreferredLanguage
        };
    }
}
