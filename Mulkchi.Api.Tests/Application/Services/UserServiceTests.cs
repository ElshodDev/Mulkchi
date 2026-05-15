using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Bogus;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Users;

namespace Mulkchi.Api.Tests.Application.Services;

/// <summary>
/// UserService unit testlari.
/// Foydalanuvchi olish, yangilash va host-ga o'tkazish logikasini tekshiradi.
/// </summary>
public class UserServiceTests
{
    private readonly Mock<IStorageBroker> storageBroker = new();
    private readonly Mock<ILoggingBroker> loggingBroker = new();
    private readonly Mock<IDateTimeBroker> dateTimeBroker = new();
    private readonly Mock<ICurrentUserService> currentUserService = new();
    private readonly Mock<IFileStorageBroker> fileStorageBroker = new();

    private static readonly DateTimeOffset FixedDate =
        new(2026, 5, 14, 12, 0, 0, TimeSpan.Zero);

    private static readonly Faker<User> UserFaker = new Faker<User>()
        .RuleFor(u => u.Id, f => f.Random.Guid())
        .RuleFor(u => u.FirstName, f => f.Name.FirstName())
        .RuleFor(u => u.LastName, f => f.Name.LastName())
        .RuleFor(u => u.Email, f => f.Internet.Email())
        .RuleFor(u => u.Phone, f => "+998901234567")
        .RuleFor(u => u.PasswordHash, f => BCrypt.Net.BCrypt.HashPassword("Test@123"))
        .RuleFor(u => u.Role, _ => UserRole.Guest)
        .RuleFor(u => u.CurrentMode, _ => UserRole.Guest)
        .RuleFor(u => u.IsVerified, _ => false)
        .RuleFor(u => u.PreferredLanguage, _ => "uz")
        .RuleFor(u => u.CreatedDate, _ => FixedDate)
        .RuleFor(u => u.UpdatedDate, _ => FixedDate);

    public UserServiceTests()
    {
        this.dateTimeBroker
            .Setup(b => b.GetCurrentDateTimeOffset())
            .Returns(FixedDate);
    }

    // ──────────────────────────────────────────
    // RetrieveUserById
    // ──────────────────────────────────────────

    [Fact]
    public async Task RetrieveUserByIdAsync_WithExistingId_ReturnsUserResponse()
    {
        // Arrange
        User user = UserFaker.Generate();

        this.storageBroker
            .Setup(b => b.SelectUserByIdAsync(user.Id))
            .ReturnsAsync(user);

        var service = CreateUserService();

        // Act
        UserResponse result = await ((IUserService)service).RetrieveUserByIdAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(user.Id);
        result.Email.Should().Be(user.Email);
        result.FirstName.Should().Be(user.FirstName);
        result.LastName.Should().Be(user.LastName);
    }

    [Fact]
    public async Task RetrieveUserByIdAsync_WithNonExistingId_ThrowsNotFoundUserException()
    {
        // Arrange
        var userId = Guid.NewGuid();

        this.storageBroker
            .Setup(b => b.SelectUserByIdAsync(userId))
            .ReturnsAsync((User?)null);

        var service = CreateUserService();

        // Act
        ValueTask<UserResponse> action = ((IUserService)service).RetrieveUserByIdAsync(userId);

        // Assert
        await Assert.ThrowsAsync<NotFoundUserException>(() => action.AsTask());
    }

    [Fact]
    public async Task RetrieveUserByIdAsync_WithEmptyId_ThrowsUserValidationException()
    {
        // Arrange
        var service = CreateUserService();

        // Act
        ValueTask<UserResponse> action = ((IUserService)service).RetrieveUserByIdAsync(Guid.Empty);

        // Assert
        await Assert.ThrowsAsync<InvalidUserException>(() => action.AsTask());
    }

    // ──────────────────────────────────────────
    // RetrieveCurrentUser
    // ──────────────────────────────────────────

    [Fact]
    public async Task RetrieveCurrentUserAsync_WithAuthenticatedUser_ReturnsCurrentUser()
    {
        // Arrange
        User user = UserFaker.Generate();

        this.currentUserService
            .Setup(s => s.GetCurrentUserId())
            .Returns(user.Id);

        this.storageBroker
            .Setup(b => b.SelectUserByIdAsync(user.Id))
            .ReturnsAsync(user);

        var service = CreateUserService();

        // Act
        UserResponse result = await service.RetrieveCurrentUserAsync();

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(user.Id);
        result.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task RetrieveCurrentUserAsync_WithoutAuthentication_ThrowsInvalidUserException()
    {
        // Arrange
        this.currentUserService
            .Setup(s => s.GetCurrentUserId())
            .Returns((Guid?)null);

        var service = CreateUserService();

        // Act
        ValueTask<UserResponse> action = service.RetrieveCurrentUserAsync();

        // Assert
        await Assert.ThrowsAsync<InvalidUserException>(() => action.AsTask());
    }

    // ──────────────────────────────────────────
    // ModifyUserProfile
    // ──────────────────────────────────────────

    [Fact]
    public async Task ModifyUserProfileAsync_WithValidDto_UpdatesProfile()
    {
        // Arrange
        User user = UserFaker.Generate();
        var dto = new UserUpdateDto
        {
            FirstName = "Yangi Ism",
            LastName = "Yangi Familiya",
            Bio = "Test bio",
            PreferredLanguage = "ru"
        };

        this.currentUserService
            .Setup(s => s.GetCurrentUserId())
            .Returns(user.Id);

        this.storageBroker
            .Setup(b => b.SelectUserByIdAsync(user.Id))
            .ReturnsAsync(user);

        this.storageBroker
            .Setup(b => b.UpdateUserAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        var service = CreateUserService();

        // Act
        UserResponse result = await service.ModifyUserProfileAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.FirstName.Should().Be("Yangi Ism");
        result.LastName.Should().Be("Yangi Familiya");
        this.storageBroker.Verify(b => b.UpdateUserAsync(It.IsAny<User>()), Times.Once);
    }

    // ──────────────────────────────────────────
    // UpgradeToHost
    // ──────────────────────────────────────────

    [Fact]
    public async Task UpgradeToHostAsync_WithGuestUser_UpgradesToHost()
    {
        // Arrange
        User user = UserFaker.Generate();
        user.Role = UserRole.Guest;

        this.storageBroker
            .Setup(b => b.SelectUserByIdAsync(user.Id))
            .ReturnsAsync(user);

        this.storageBroker
            .Setup(b => b.UpdateUserAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        var service = CreateUserService();

        // Act
        User result = await service.UpgradeToHostAsync(user.Id);

        // Assert
        result.Role.Should().Be(UserRole.Host);
        result.CurrentMode.Should().Be(UserRole.Host);
        result.HostSince.Should().NotBeNull();
        result.HostSince!.Value.Should().Be(FixedDate);
        this.storageBroker.Verify(b => b.UpdateUserAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task UpgradeToHostAsync_WithExistingHostUser_DoesNotChangeRole()
    {
        // Arrange
        User user = UserFaker.Generate();
        user.Role = UserRole.Host;
        user.HostSince = FixedDate.AddDays(-30);

        this.storageBroker
            .Setup(b => b.SelectUserByIdAsync(user.Id))
            .ReturnsAsync(user);

        var service = CreateUserService();

        // Act
        User result = await service.UpgradeToHostAsync(user.Id);

        // Assert
        result.Role.Should().Be(UserRole.Host);
        this.storageBroker.Verify(b => b.UpdateUserAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task UpgradeToHostAsync_WithNonExistingUser_ThrowsNotFoundUserException()
    {
        // Arrange
        var userId = Guid.NewGuid();

        this.storageBroker
            .Setup(b => b.SelectUserByIdAsync(userId))
            .ReturnsAsync((User?)null);

        var service = CreateUserService();

        // Act
        ValueTask<User> action = service.UpgradeToHostAsync(userId);

        // Assert
        await Assert.ThrowsAsync<NotFoundUserException>(() => action.AsTask());
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    private UserService CreateUserService() => new(
        this.storageBroker.Object,
        this.loggingBroker.Object,
        this.dateTimeBroker.Object,
        this.currentUserService.Object,
        this.fileStorageBroker.Object);
}
