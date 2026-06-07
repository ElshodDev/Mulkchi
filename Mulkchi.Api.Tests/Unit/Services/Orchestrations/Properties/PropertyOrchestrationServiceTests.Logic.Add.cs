using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.SavedSearches;
using Mulkchi.Api.Models.Foundations.Users;
using Xunit;

namespace Mulkchi.Api.Tests.Unit.Services.Orchestrations.Properties;

public partial class PropertyOrchestrationServiceTests
{
    [Fact]
    public async Task ShouldAddPropertyAndNotifySavedSearchesAsync()
    {
        // given
        Guid randomUserId = Guid.NewGuid();
        ClaimsPrincipal randomUser = CreateRandomClaimsPrincipal(randomUserId);
        Property randomProperty = CreateRandomProperty();
        PropertyCreateDto randomPropertyDto = new PropertyCreateDto(); // Mock input
        PropertyResponse randomPropertyResponse = new PropertyResponse { Id = randomProperty.Id };

        SavedSearch randomSavedSearch = CreateRandomSavedSearch(randomProperty);
        IQueryable<SavedSearch> savedSearches = new List<SavedSearch> { randomSavedSearch }.AsQueryable();
        
        User randomUserWithTelegram = CreateRandomUserWithTelegram(randomSavedSearch.UserId);
        IQueryable<User> users = new List<User> { randomUserWithTelegram }.AsQueryable();

        this.propertyServiceMock.Setup(service =>
            service.AddPropertyAsync(It.IsAny<PropertyCreateDto>()))
            .ReturnsAsync(randomPropertyResponse);

        this.propertyServiceMock.Setup(service =>
            service.RetrievePropertyByIdAsync(randomProperty.Id))
            .ReturnsAsync(randomProperty);

        this.savedSearchServiceMock.Setup(service =>
            service.RetrieveAllSavedSearches())
            .Returns(savedSearches);

        this.userServiceMock.Setup(service =>
            service.UpgradeToHostAsync(randomUserId))
            .ReturnsAsync(randomUserWithTelegram);

        this.userServiceMock.Setup(service =>
            service.RetrieveAllUsers())
            .Returns(users);

        // when
        PropertyCreateResponse actualResponse = 
            await this.propertyOrchestrationService.AddPropertyWithUserUpgradeAsync(randomPropertyDto, randomUser);

        // Allow background task to complete
        await Task.Delay(500);

        // then
        actualResponse.Should().NotBeNull();
        actualResponse.Property.Id.Should().Be(randomProperty.Id);

        this.propertyServiceMock.Verify(service =>
            service.AddPropertyAsync(It.IsAny<PropertyCreateDto>()), Times.Once);

        this.propertyServiceMock.Verify(service =>
            service.RetrievePropertyByIdAsync(randomProperty.Id), Times.Once);

        this.userServiceMock.Verify(service =>
            service.UpgradeToHostAsync(randomUserId), Times.Once);

        this.userServiceMock.Verify(service =>
            service.RetrieveAllUsers(), Times.Once);

        this.savedSearchServiceMock.Verify(service =>
            service.RetrieveAllSavedSearches(), Times.Once);

        this.telegramBrokerMock.Verify(broker =>
            broker.SendMessageAsync(
                randomUserWithTelegram.TelegramId.Value,
                It.Is<string>(msg => msg.Contains("Yangi e'lon topildi"))),
            Times.Once);

        this.propertyServiceMock.VerifyNoOtherCalls();
        this.userServiceMock.VerifyNoOtherCalls();
        this.savedSearchServiceMock.VerifyNoOtherCalls();
    }
}
