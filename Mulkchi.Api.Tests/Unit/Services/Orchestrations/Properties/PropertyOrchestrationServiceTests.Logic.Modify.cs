using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Favorites;
using Mulkchi.Api.Models.Foundations.Users;
using Xunit;

namespace Mulkchi.Api.Tests.Unit.Services.Orchestrations.Properties;

public partial class PropertyOrchestrationServiceTests
{
    [Fact]
    public async Task ShouldModifyPropertyAndNotifyPriceDropAsync()
    {
        // given
        Guid randomUserId = Guid.NewGuid();
        ClaimsPrincipal randomUser = CreateRandomClaimsPrincipal(randomUserId);
        
        Property randomProperty = CreateRandomProperty();
        randomProperty.SalePrice = 45000; // New Price

        Property oldProperty = new Property
        {
            Id = randomProperty.Id,
            SalePrice = 50000, // Old Price (Higher)
            ListingType = ListingType.Sale,
            City = randomProperty.City
        };

        Favorite randomFavorite = CreateRandomFavorite(randomProperty.Id);
        IQueryable<Favorite> favorites = new List<Favorite> { randomFavorite }.AsQueryable();
        
        User randomUserWithTelegram = CreateRandomUserWithTelegram(randomFavorite.UserId);
        IQueryable<User> users = new List<User> { randomUserWithTelegram }.AsQueryable();

        this.propertyServiceMock.Setup(service =>
            service.RetrievePropertyByIdAsync(randomProperty.Id))
            .ReturnsAsync(oldProperty);

        this.propertyServiceMock.Setup(service =>
            service.ModifyPropertyAsync(It.IsAny<Property>()))
            .ReturnsAsync(randomProperty);

        this.favoriteServiceMock.Setup(service =>
            service.RetrieveAllFavorites())
            .Returns(favorites);

        this.userServiceMock.Setup(service =>
            service.RetrieveAllUsers())
            .Returns(users);

        // when
        Property actualProperty = 
            await this.propertyOrchestrationService.ModifyPropertyAsync(randomProperty, randomUser);

        // Allow background task to complete
        await Task.Delay(500);

        // then
        actualProperty.Should().NotBeNull();
        actualProperty.Id.Should().Be(randomProperty.Id);

        this.propertyServiceMock.Verify(service =>
            service.RetrievePropertyByIdAsync(randomProperty.Id), Times.Once);

        this.propertyServiceMock.Verify(service =>
            service.ModifyPropertyAsync(It.IsAny<Property>()), Times.Once);

        this.favoriteServiceMock.Verify(service =>
            service.RetrieveAllFavorites(), Times.Once);

        this.userServiceMock.Verify(service =>
            service.RetrieveAllUsers(), Times.Once);

        this.telegramBrokerMock.Verify(broker =>
            broker.SendMessageAsync(
                randomUserWithTelegram.TelegramId.Value,
                It.Is<string>(msg => msg.Contains("Narx arzonlashdi"))),
            Times.Once);

        this.propertyServiceMock.VerifyNoOtherCalls();
        this.favoriteServiceMock.VerifyNoOtherCalls();
        this.userServiceMock.VerifyNoOtherCalls();
    }
}
