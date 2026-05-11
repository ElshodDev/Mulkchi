using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Controllers;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Favorites;
using Mulkchi.Api.Models.Foundations.Favorites.Exceptions;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Favorites;

namespace Mulkchi.Api.Tests.Application.Services;

public class FavoritesServiceTests
{
    private readonly Mock<IStorageBroker> storageBroker = new();
    private readonly Mock<ILoggingBroker> loggingBroker = new();
    private readonly Mock<IDateTimeBroker> dateTimeBroker = new();
    private readonly Mock<ICurrentUserService> currentUserService = new();

    public FavoritesServiceTests()
    {
        this.dateTimeBroker.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(new DateTimeOffset(2026, 05, 11, 12, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task AddFavoriteAsync_WithValidFavorite_ReturnsFavorite()
    {
        // Arrange
        var favorite = new Favorite
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            PropertyId = Guid.NewGuid()
        };

        var property = new Property
        {
            Id = favorite.PropertyId,
            FavoritesCount = 0
        };

        this.storageBroker.Setup(broker => broker.SelectAllFavorites())
            .Returns(Array.Empty<Favorite>().AsQueryable());
        this.storageBroker.Setup(broker => broker.InsertFavoriteAsync(It.IsAny<Favorite>()))
            .ReturnsAsync((Favorite item) => item);
        this.storageBroker.Setup(broker => broker.SelectPropertyByIdAsync(favorite.PropertyId))
            .ReturnsAsync(property);
        this.storageBroker.Setup(broker => broker.UpdatePropertyAsync(It.IsAny<Property>()))
            .ReturnsAsync((Property item) => item);

        var favoriteService = CreateFavoriteService();

        // Act
        Favorite result = await favoriteService.AddFavoriteAsync(favorite);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(favorite.Id, result.Id);
        Assert.Equal(favorite.UserId, result.UserId);
        Assert.Equal(favorite.PropertyId, result.PropertyId);
        Assert.Equal(1, property.FavoritesCount);
        this.storageBroker.Verify(broker => broker.InsertFavoriteAsync(It.IsAny<Favorite>()), Times.Once);
    }

    [Fact]
    public async Task AddFavoriteAsync_WithDuplicateFavorite_ThrowsFavoriteDependencyValidationException()
    {
        // Arrange
        var favorite = new Favorite
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            PropertyId = Guid.NewGuid()
        };

        var existingFavorite = new Favorite
        {
            Id = Guid.NewGuid(),
            UserId = favorite.UserId,
            PropertyId = favorite.PropertyId
        };

        this.storageBroker.Setup(broker => broker.SelectAllFavorites())
            .Returns(new[] { existingFavorite }.AsQueryable());

        var favoriteService = CreateFavoriteService();

        // Act
        ValueTask<Favorite> action = favoriteService.AddFavoriteAsync(favorite);

        // Assert
        await Assert.ThrowsAsync<FavoriteDependencyValidationException>(() => action.AsTask());
    }

    [Fact]
    public async Task RemoveFavoriteByIdAsync_WithNonOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var favoriteId = Guid.NewGuid();

        var existingFavorite = new Favorite
        {
            Id = favoriteId,
            UserId = Guid.NewGuid(),
            PropertyId = Guid.NewGuid()
        };

        this.currentUserService.Setup(service => service.GetCurrentUserId())
            .Returns(currentUserId);
        this.currentUserService.Setup(service => service.IsInRole("Admin"))
            .Returns(false);
        this.storageBroker.Setup(broker => broker.SelectFavoriteByIdAsync(favoriteId))
            .ReturnsAsync(existingFavorite);

        var favoriteService = CreateFavoriteService();

        // Act
        ValueTask<Favorite> action = favoriteService.RemoveFavoriteByIdAsync(favoriteId);

        // Assert
        FavoriteServiceException exception = await Assert.ThrowsAsync<FavoriteServiceException>(() => action.AsTask());
        FailedFavoriteServiceException innerException = Assert.IsType<FailedFavoriteServiceException>(exception.InnerException);
        Assert.IsType<UnauthorizedAccessException>(innerException.InnerException);
    }

    [Fact]
    public void RetrieveAllFavorites_ReturnsQueryableFavorites()
    {
        // Arrange
        var favoriteId = Guid.NewGuid();
        var favorites = new List<Favorite>
        {
            new()
            {
                Id = favoriteId,
                UserId = Guid.NewGuid(),
                PropertyId = Guid.NewGuid()
            }
        };

        this.storageBroker.Setup(broker => broker.SelectAllFavorites())
            .Returns(favorites.AsQueryable());

        var favoriteService = CreateFavoriteService();

        // Act
        IQueryable<Favorite> result = favoriteService.RetrieveAllFavorites();

        // Assert
        Assert.Single(result);
        Assert.Equal(favoriteId, result.First().Id);
    }

    private FavoriteService CreateFavoriteService() => new(
        this.storageBroker.Object,
        this.loggingBroker.Object,
        this.dateTimeBroker.Object,
        this.currentUserService.Object);
}

public class FavoritesControllerTests
{
    [Fact]
    public void GetAllFavorites_WithAuthenticatedUser_ReturnsOnlyOwnFavorites()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        var favorites = new List<Favorite>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                PropertyId = Guid.NewGuid()
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId,
                PropertyId = Guid.NewGuid()
            }
        }.AsQueryable();

        var favoriteService = new Mock<IFavoriteService>();
        favoriteService.Setup(service => service.RetrieveAllFavorites())
            .Returns(favorites);

        var controller = new FavoritesController(favoriteService.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, currentUserId.ToString()),
                        new Claim(ClaimTypes.Role, "Guest")
                    }, authenticationType: "TestAuth"))
                }
            }
        };

        // Act
        ActionResult<PagedResult<Favorite>> actionResult = controller.GetAllFavorites(new PaginationParams
        {
            Page = 1,
            PageSize = 10
        });

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        PagedResult<Favorite> pagedResult = Assert.IsType<PagedResult<Favorite>>(okResult.Value);

        Assert.Single(pagedResult.Items);
        Assert.All(pagedResult.Items, favorite => Assert.Equal(currentUserId, favorite.UserId));
        Assert.Equal(1, pagedResult.TotalCount);
    }
}