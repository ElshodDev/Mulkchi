using System.Collections.Generic;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Notifications;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Tokens;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Tests.Application.Services;

public class AuthServiceTests
{
    private readonly Mock<IStorageBroker> storageBroker = new();
    private readonly Mock<ILoggingBroker> loggingBroker = new();
    private readonly Mock<IDateTimeBroker> dateTimeBroker = new();
    private readonly Mock<ITokenBroker> tokenBroker = new();
    private readonly Mock<IEmailBroker> emailBroker = new();
    private readonly Mock<ISmsBroker> smsBroker = new();
    private readonly Mock<IHttpClientFactory> httpClientFactory = new();
    private readonly Mock<IRefreshTokenGuard> refreshTokenGuard = new();
    private readonly IConfiguration configuration;

    public AuthServiceTests()
    {
        this.configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AppSettings:FrontendUrl"] = "https://mulkchi.uz"
            })
            .Build();

        this.dateTimeBroker.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(new DateTimeOffset(2026, 05, 11, 12, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task RegisterAsync_WithNewUser_ReturnsAuthResponse()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "Ali",
            LastName = "Valiyev",
            Email = "ali@example.com",
            Phone = "+998901234567",
            Password = "P@ssw0rd!",
            PreferredLanguage = "uz"
        };

        var storedUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Guest,
            CreatedDate = this.dateTimeBroker.Object.GetCurrentDateTimeOffset(),
            UpdatedDate = this.dateTimeBroker.Object.GetCurrentDateTimeOffset()
        };

        this.storageBroker.Setup(broker => broker.SelectUserByEmailAsync(request.Email))
            .ReturnsAsync((User?)null);
        this.storageBroker.Setup(broker => broker.InsertUserAsync(It.IsAny<User>()))
            .ReturnsAsync(storedUser);
        this.storageBroker.Setup(broker => broker.InsertEmailVerificationTokenAsync(It.IsAny<EmailVerificationToken>()))
            .ReturnsAsync((EmailVerificationToken token) => token);
        this.storageBroker.Setup(broker => broker.InsertRefreshTokenAsync(It.IsAny<UserRefreshToken>()))
            .ReturnsAsync((UserRefreshToken token) => token);
        this.tokenBroker.Setup(broker => broker.GenerateToken(It.IsAny<User>()))
            .Returns("access-token");
        this.tokenBroker.Setup(broker => broker.GenerateRefreshToken())
            .Returns("refresh-token");
        this.emailBroker.Setup(broker => broker.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var authService = CreateAuthService();

        // Act
        AuthResponse result = await authService.RegisterAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("access-token", result.Token);
        Assert.Equal("refresh-token", result.RefreshToken);
        Assert.Equal(request.Email, result.Email);
        Assert.Equal(storedUser.Id, result.UserId);

        this.storageBroker.Verify(broker => broker.InsertUserAsync(It.IsAny<User>()), Times.Once);
        this.storageBroker.Verify(broker => broker.InsertEmailVerificationTokenAsync(It.IsAny<EmailVerificationToken>()), Times.Once);
        this.storageBroker.Verify(broker => broker.InsertRefreshTokenAsync(It.IsAny<UserRefreshToken>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ThrowsAuthDependencyValidationException()
    {
        // Arrange
        var request = new RegisterRequest
        {
            FirstName = "Ali",
            LastName = "Valiyev",
            Email = "ali@example.com",
            Phone = "+998901234567",
            Password = "P@ssw0rd!",
            PreferredLanguage = "uz"
        };

        this.storageBroker.Setup(broker => broker.SelectUserByEmailAsync(request.Email))
            .ReturnsAsync(new User { Id = Guid.NewGuid(), Email = request.Email });

        var authService = CreateAuthService();

        // Act
        ValueTask<AuthResponse> action = authService.RegisterAsync(request);

        // Assert
        await Assert.ThrowsAsync<AuthDependencyValidationException>(() => action.AsTask());
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var password = "P@ssw0rd!";
        var request = new LoginRequest
        {
            Email = "ali@example.com",
            Password = password
        };

        var storedUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Ali",
            LastName = "Valiyev",
            Email = request.Email,
            Phone = "+998901234567",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Guest,
            CreatedDate = this.dateTimeBroker.Object.GetCurrentDateTimeOffset(),
            UpdatedDate = this.dateTimeBroker.Object.GetCurrentDateTimeOffset()
        };

        this.storageBroker.Setup(broker => broker.SelectUserByEmailAsync(request.Email))
            .ReturnsAsync(storedUser);
        this.storageBroker.Setup(broker => broker.InsertRefreshTokenAsync(It.IsAny<UserRefreshToken>()))
            .ReturnsAsync((UserRefreshToken token) => token);
        this.tokenBroker.Setup(broker => broker.GenerateToken(It.IsAny<User>()))
            .Returns("access-token");
        this.tokenBroker.Setup(broker => broker.GenerateRefreshToken())
            .Returns("refresh-token");

        var authService = CreateAuthService();

        // Act
        AuthResponse result = await authService.LoginAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("access-token", result.Token);
        Assert.Equal("refresh-token", result.RefreshToken);
        Assert.Equal(request.Email, result.Email);
        Assert.Equal(storedUser.Id, result.UserId);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsAuthValidationException()
    {
        // Arrange
        var request = new LoginRequest
        {
            Email = "ali@example.com",
            Password = "WrongP@ss1!"
        };

        var storedUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Ali",
            LastName = "Valiyev",
            Email = request.Email,
            Phone = "+998901234567",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssw0rd!") ,
            Role = UserRole.Guest,
            CreatedDate = this.dateTimeBroker.Object.GetCurrentDateTimeOffset(),
            UpdatedDate = this.dateTimeBroker.Object.GetCurrentDateTimeOffset()
        };

        this.storageBroker.Setup(broker => broker.SelectUserByEmailAsync(request.Email))
            .ReturnsAsync(storedUser);

        var authService = CreateAuthService();

        // Act
        ValueTask<AuthResponse> action = authService.LoginAsync(request);

        // Assert
        await Assert.ThrowsAsync<AuthValidationException>(() => action.AsTask());
    }

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ThrowsAuthValidationException()
    {
        // Arrange
        const string refreshToken = "refresh-token";
        var expiredToken = new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Token = "hashed-token",
            ExpiresAt = this.dateTimeBroker.Object.GetCurrentDateTimeOffset().AddMinutes(-1),
            IsRevoked = false,
            CreatedDate = this.dateTimeBroker.Object.GetCurrentDateTimeOffset().AddDays(-30)
        };

        this.refreshTokenGuard.Setup(guard => guard.TryReserve(It.IsAny<string>(), It.IsAny<TimeSpan>()))
            .Returns(true);
        this.refreshTokenGuard.Setup(guard => guard.ReleaseReservation(It.IsAny<string>()));
        this.storageBroker.Setup(broker => broker.SelectRefreshTokenAsync(It.IsAny<string>()))
            .ReturnsAsync(expiredToken);

        var authService = CreateAuthService();

        // Act
        ValueTask<AuthResponse> action = authService.RefreshTokenAsync(refreshToken);

        // Assert
        await Assert.ThrowsAsync<AuthValidationException>(() => action.AsTask());
    }

    private AuthService CreateAuthService() => new(
        this.storageBroker.Object,
        this.loggingBroker.Object,
        this.dateTimeBroker.Object,
        this.tokenBroker.Object,
        this.emailBroker.Object,
        this.smsBroker.Object,
        this.configuration,
        this.httpClientFactory.Object,
        this.refreshTokenGuard.Object);
}