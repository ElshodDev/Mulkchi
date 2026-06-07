using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Users;
using Mulkchi.Api.Brokers.OneId;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Users;

public partial class UserServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly Mock<ICurrentUserService> currentUserServiceMock;
    private readonly Mock<IFileStorageBroker> fileStorageBrokerMock;
    private readonly Mock<IOneIdBroker> oneIdBrokerMock;
    private readonly IUserService userService;

    public UserServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();
        this.currentUserServiceMock = new Mock<ICurrentUserService>();
        this.fileStorageBrokerMock = new Mock<IFileStorageBroker>();
        this.oneIdBrokerMock = new Mock<IOneIdBroker>();

        this.userService = new UserService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object,
            this.currentUserServiceMock.Object,
            this.fileStorageBrokerMock.Object,
            this.oneIdBrokerMock.Object);
    }

    private static User CreateRandomUser()
    {
        return new Faker<User>()
            .RuleFor(u => u.Id, f => Guid.NewGuid())
            .RuleFor(u => u.FirstName, f => f.Name.FirstName())
            .RuleFor(u => u.LastName, f => f.Name.LastName())
            .RuleFor(u => u.Email, f => f.Internet.Email())
            .RuleFor(u => u.Phone, f => f.Phone.PhoneNumber())
            .RuleFor(u => u.PasswordHash, f => f.Internet.Password())
            .RuleFor(u => u.Role, f => UserRole.Guest)
            .RuleFor(u => u.CurrentMode, f => UserRole.Guest)
            .RuleFor(u => u.CreatedDate, f => f.Date.PastOffset())
            .RuleFor(u => u.UpdatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddUserAsync_WithValidUser_ShouldAddUser()
    {
        // Arrange
        var user = CreateRandomUser();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertUserAsync(It.IsAny<User>()))
            .ReturnsAsync(user);

        // Act
        var result = await this.userService.AddUserAsync(user);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(user.Id);
        
        this.storageBrokerMock.Verify(broker => broker.InsertUserAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task RetrieveUserByIdAsync_WhenUserExists_ShouldReturnUserResponse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateRandomUser();
        user.Id = userId;

        this.storageBrokerMock.Setup(broker => broker.SelectUserByIdAsync(userId))
            .ReturnsAsync(user);

        // Act
        var result = await this.userService.RetrieveUserByIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(userId);
        result.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task RetrieveUserByIdAsync_WhenUserDoesNotExist_ShouldThrowNotFoundUserException()
    {
        // Arrange
        var userId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectUserByIdAsync(userId))
            .ReturnsAsync((User)null);

        // Act
        Func<Task> action = async () => await this.userService.RetrieveUserByIdAsync(userId);

        // Assert
        await action.Should().ThrowAsync<NotFoundUserException>();
    }

    [Fact]
    public async Task RetrieveCurrentUserAsync_WhenUserAuthenticatedAndExists_ShouldReturnUserResponse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateRandomUser();
        user.Id = userId;

        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(userId);
        this.storageBrokerMock.Setup(broker => broker.SelectUserByIdAsync(userId))
            .ReturnsAsync(user);

        // Act
        var result = await this.userService.RetrieveCurrentUserAsync();

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(userId);
    }

    [Fact]
    public async Task RetrieveCurrentUserAsync_WhenUserNotAuthenticated_ShouldThrowInvalidUserException()
    {
        // Arrange
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns((Guid?)null);

        // Act
        Func<Task> action = async () => await this.userService.RetrieveCurrentUserAsync();

        // Assert
        await action.Should().ThrowAsync<InvalidUserException>();
    }

    [Fact]
    public async Task UpgradeToHostAsync_WhenUserExists_ShouldUpgradeRole()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateRandomUser();
        user.Id = userId;
        user.Role = UserRole.Guest;

        var now = DateTimeOffset.UtcNow;

        this.storageBrokerMock.Setup(broker => broker.SelectUserByIdAsync(userId))
            .ReturnsAsync(user);
        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.UpdateUserAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var result = await this.userService.UpgradeToHostAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result.Role.Should().Be(UserRole.Host);
        result.CurrentMode.Should().Be(UserRole.Host);
        this.storageBrokerMock.Verify(broker => broker.UpdateUserAsync(It.IsAny<User>()), Times.Once);
    }
}
