using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Favorites;
using Mulkchi.Api.Models.Foundations.Favorites.Exceptions;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Favorites;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Favorites;

public class FavoriteServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly Mock<ICurrentUserService> currentUserServiceMock;
    private readonly IFavoriteService favoriteService;

    public FavoriteServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();
        this.currentUserServiceMock = new Mock<ICurrentUserService>();

        this.favoriteService = new FavoriteService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object,
            this.currentUserServiceMock.Object);
    }

    private static Favorite CreateRandomFavorite()
    {
        return new Faker<Favorite>()
            .RuleFor(f => f.Id, faker => Guid.NewGuid())
            .RuleFor(f => f.UserId, faker => Guid.NewGuid())
            .RuleFor(f => f.PropertyId, faker => Guid.NewGuid())
            .RuleFor(f => f.CreatedDate, faker => faker.Date.PastOffset())
            .RuleFor(f => f.UpdatedDate, faker => faker.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddFavoriteAsync_WithValidFavorite_ShouldAddFavorite()
    {
        // Arrange
        var favorite = CreateRandomFavorite();
        var now = DateTimeOffset.UtcNow;
        var property = new Property { Id = favorite.PropertyId, FavoritesCount = 0 };

        this.storageBrokerMock.Setup(broker => broker.SelectAllFavorites())
            .Returns(new List<Favorite>().AsQueryable());
        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertFavoriteAsync(It.IsAny<Favorite>()))
            .ReturnsAsync(favorite);
        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(favorite.PropertyId))
            .ReturnsAsync(property);

        // Act
        var result = await this.favoriteService.AddFavoriteAsync(favorite);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(favorite.Id);

        this.storageBrokerMock.Verify(broker => broker.InsertFavoriteAsync(It.IsAny<Favorite>()), Times.Once);
        this.storageBrokerMock.Verify(broker => broker.UpdatePropertyAsync(It.IsAny<Property>()), Times.Once);
    }

    [Fact]
    public async Task AddFavoriteAsync_WhenFavoriteAlreadyExists_ShouldThrowAlreadyExistsFavoriteException()
    {
        // Arrange
        var favorite = CreateRandomFavorite();
        var existingFavorites = new List<Favorite> { favorite }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllFavorites())
            .Returns(existingFavorites);

        // Act
        Func<Task> action = async () => await this.favoriteService.AddFavoriteAsync(favorite);

        // Assert
        var exception = await action.Should().ThrowAsync<FavoriteDependencyValidationException>();
        exception.WithInnerException<AlreadyExistsFavoriteException>();
    }

    [Fact]
    public async Task AddFavoriteAsync_WhenFavoriteIsNull_ShouldThrowNullFavoriteException()
    {
        // Arrange
        Favorite nullFavorite = null;

        // Act
        Func<Task> action = async () => await this.favoriteService.AddFavoriteAsync(nullFavorite);

        // Assert
        var exception = await action.Should().ThrowAsync<FavoriteValidationException>();
        exception.WithInnerException<NullFavoriteException>();
    }

    [Fact]
    public void RetrieveAllFavorites_ShouldReturnFavorites()
    {
        // Arrange
        var favorites = new List<Favorite>
        {
            CreateRandomFavorite(),
            CreateRandomFavorite()
        }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllFavorites())
            .Returns(favorites);

        // Act
        var result = this.favoriteService.RetrieveAllFavorites();

        // Assert
        result.Should().NotBeNull();
        result.Count().Should().Be(2);
    }

    [Fact]
    public async Task RetrieveFavoriteByIdAsync_WhenFavoriteExistsAndUserOwnsIt_ShouldReturnFavorite()
    {
        // Arrange
        var favoriteId = Guid.NewGuid();
        var favorite = CreateRandomFavorite();
        favorite.Id = favoriteId;

        this.storageBrokerMock.Setup(broker => broker.SelectFavoriteByIdAsync(favoriteId))
            .ReturnsAsync(favorite);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(favorite.UserId);

        // Act
        var result = await this.favoriteService.RetrieveFavoriteByIdAsync(favoriteId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(favoriteId);
    }

    [Fact]
    public async Task RetrieveFavoriteByIdAsync_WhenUserDoesNotOwnIt_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var favoriteId = Guid.NewGuid();
        var favorite = CreateRandomFavorite();
        favorite.Id = favoriteId;

        this.storageBrokerMock.Setup(broker => broker.SelectFavoriteByIdAsync(favoriteId))
            .ReturnsAsync(favorite);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(Guid.NewGuid()); // Different user

        // Act
        Func<Task> action = async () => await this.favoriteService.RetrieveFavoriteByIdAsync(favoriteId);

        // Assert
        var exception = await action.Should().ThrowAsync<FavoriteDependencyValidationException>();
        exception.WithInnerException<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RemoveFavoriteByIdAsync_WhenFavoriteExistsAndUserOwnsIt_ShouldRemoveFavorite()
    {
        // Arrange
        var favoriteId = Guid.NewGuid();
        var favorite = CreateRandomFavorite();
        favorite.Id = favoriteId;
        var property = new Property { Id = favorite.PropertyId, FavoritesCount = 1 };

        this.storageBrokerMock.Setup(broker => broker.SelectFavoriteByIdAsync(favoriteId))
            .ReturnsAsync(favorite);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(favorite.UserId);
        this.storageBrokerMock.Setup(broker => broker.DeleteFavoriteByIdAsync(favoriteId))
            .ReturnsAsync(favorite);
        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(favorite.PropertyId))
            .ReturnsAsync(property);

        // Act
        var result = await this.favoriteService.RemoveFavoriteByIdAsync(favoriteId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(favoriteId);
        this.storageBrokerMock.Verify(broker => broker.DeleteFavoriteByIdAsync(favoriteId), Times.Once);
        this.storageBrokerMock.Verify(broker => broker.UpdatePropertyAsync(It.IsAny<Property>()), Times.Once);
    }

    [Fact]
    public async Task RetrieveFavoriteByIdAsync_WhenFavoriteDoesNotExist_ShouldThrowNotFoundFavoriteException()
    {
        // Arrange
        var favoriteId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectFavoriteByIdAsync(favoriteId))
            .ReturnsAsync((Favorite)null);

        // Act
        Func<Task> action = async () => await this.favoriteService.RetrieveFavoriteByIdAsync(favoriteId);

        // Assert
        var exception = await action.Should().ThrowAsync<FavoriteDependencyValidationException>();
        exception.WithInnerException<NotFoundFavoriteException>();
    }

    [Fact]
    public async Task ModifyFavoriteAsync_WithValidFavoriteAndUserOwnsIt_ShouldModifyFavorite()
    {
        // Arrange
        var favorite = CreateRandomFavorite();
        var now = DateTimeOffset.UtcNow;

        this.storageBrokerMock.Setup(broker => broker.SelectFavoriteByIdAsync(favorite.Id))
            .ReturnsAsync(favorite);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(favorite.UserId);
        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.UpdateFavoriteAsync(favorite))
            .ReturnsAsync(favorite);

        // Act
        var result = await this.favoriteService.ModifyFavoriteAsync(favorite);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(favorite.Id);

        this.storageBrokerMock.Verify(broker => broker.UpdateFavoriteAsync(It.IsAny<Favorite>()), Times.Once);
    }

    [Fact]
    public async Task ModifyFavoriteAsync_WhenUserDoesNotOwnIt_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var favorite = CreateRandomFavorite();

        this.storageBrokerMock.Setup(broker => broker.SelectFavoriteByIdAsync(favorite.Id))
            .ReturnsAsync(favorite);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(Guid.NewGuid()); // Different user

        // Act
        Func<Task> action = async () => await this.favoriteService.ModifyFavoriteAsync(favorite);

        // Assert
        var exception = await action.Should().ThrowAsync<FavoriteDependencyValidationException>();
        exception.WithInnerException<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RemoveFavoriteByIdAsync_WhenFavoriteDoesNotExist_ShouldThrowNotFoundFavoriteException()
    {
        // Arrange
        var favoriteId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectFavoriteByIdAsync(favoriteId))
            .ReturnsAsync((Favorite)null);

        // Act
        Func<Task> action = async () => await this.favoriteService.RemoveFavoriteByIdAsync(favoriteId);

        // Assert
        var exception = await action.Should().ThrowAsync<FavoriteDependencyValidationException>();
        exception.WithInnerException<NotFoundFavoriteException>();
    }
}
