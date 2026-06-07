using System;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Mulkchi.Api.Brokers.OneId;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Users;

public partial class UserServiceTests
{
    [Fact]
    public async Task VerifyHostWithOneIdAsync_WithValidCode_ShouldUpgradeToHost()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateRandomUser();
        user.Id = userId;
        user.Role = UserRole.Guest;
        user.IsVerified = false;
        var authCode = "valid_auth_code";
        
        var userInfo = new OneIdUserInfo
        {
            FirstName = "Eshmat",
            LastName = "Toshmatov",
            Pinfl = "123456"
        };
        
        var now = DateTimeOffset.UtcNow;

        this.currentUserServiceMock.Setup(s => s.GetCurrentUserId()).Returns(userId);
        this.storageBrokerMock.Setup(b => b.SelectUserByIdAsync(userId)).ReturnsAsync(user);
        this.oneIdBrokerMock.Setup(b => b.GetUserInfoAsync(authCode)).ReturnsAsync(userInfo);
        this.dateTimeBrokerMock.Setup(b => b.GetCurrentDateTimeOffset()).Returns(now);
        this.storageBrokerMock.Setup(b => b.UpdateUserAsync(user)).ReturnsAsync(user);

        // Act
        var result = await this.userService.VerifyHostWithOneIdAsync(authCode);

        // Assert
        result.Should().NotBeNull();
        result.Role.Should().Be(UserRole.Host.ToString());
        result.IsVerified.Should().BeTrue();
        
        this.storageBrokerMock.Verify(b => b.UpdateUserAsync(It.Is<User>(u => 
            u.Role == UserRole.Host && 
            u.IsVerified == true)), Times.Once);
    }

    [Fact]
    public async Task VerifyHostWithOneIdAsync_WithInvalidCode_ShouldThrowInvalidUserException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateRandomUser();
        user.Id = userId;
        var authCode = "invalid_code";

        this.currentUserServiceMock.Setup(s => s.GetCurrentUserId()).Returns(userId);
        this.storageBrokerMock.Setup(b => b.SelectUserByIdAsync(userId)).ReturnsAsync(user);
        this.oneIdBrokerMock.Setup(b => b.GetUserInfoAsync(authCode)).ReturnsAsync((OneIdUserInfo?)null);

        // Act
        Func<Task> action = async () => await this.userService.VerifyHostWithOneIdAsync(authCode);

        // Assert
        await action.Should().ThrowAsync<InvalidUserException>()
            .WithMessage("*Invalid OneID code.*");
    }
}
