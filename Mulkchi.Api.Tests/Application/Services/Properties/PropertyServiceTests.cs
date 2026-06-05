using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Localization;
using Microsoft.FeatureManagement;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Properties.Exceptions;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Resources;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Users;
using Mulkchi.Api.Services.Search;
using Xunit;
using FluentAssertions;
using Bogus;

namespace Mulkchi.Api.Tests.Application.Services.Properties;

public class PropertyServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly Mock<ICurrentUserService> currentUserServiceMock;
    private readonly Mock<IUserService> userServiceMock;
    private readonly Mock<IAuthService> authServiceMock;
    private readonly Mock<IStringLocalizer<SharedResource>> localizerMock;
    private readonly Mock<IDistributedCache> distributedCacheMock;
    private readonly Mock<IFeatureManager> featureManagerMock;
    private readonly Mock<IMeiliPropertySearchService> meiliPropertySearchServiceMock;
    private readonly IPropertyService propertyService;

    public PropertyServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();
        this.currentUserServiceMock = new Mock<ICurrentUserService>();
        this.userServiceMock = new Mock<IUserService>();
        this.authServiceMock = new Mock<IAuthService>();
        this.localizerMock = new Mock<IStringLocalizer<SharedResource>>();
        this.distributedCacheMock = new Mock<IDistributedCache>();
        this.featureManagerMock = new Mock<IFeatureManager>();
        this.meiliPropertySearchServiceMock = new Mock<IMeiliPropertySearchService>();

        this.propertyService = new PropertyService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object,
            this.currentUserServiceMock.Object,
            this.userServiceMock.Object,
            this.authServiceMock.Object,
            this.localizerMock.Object,
            this.distributedCacheMock.Object,
            this.featureManagerMock.Object,
            this.meiliPropertySearchServiceMock.Object);
    }

    private static Property CreateRandomProperty(Guid? hostId = null)
    {
        return new Faker<Property>()
            .RuleFor(p => p.Id, f => Guid.NewGuid())
            .RuleFor(p => p.HostId, f => hostId ?? Guid.NewGuid())
            .RuleFor(p => p.Title, f => f.Lorem.Sentence())
            .RuleFor(p => p.Description, f => f.Lorem.Paragraph())
            .RuleFor(p => p.Type, f => PropertyType.Apartment)
            .RuleFor(p => p.ListingType, f => ListingType.Rent)
            .RuleFor(p => p.MonthlyRent, f => f.Random.Decimal(100, 5000))
            .RuleFor(p => p.City, f => f.Address.City())
            .RuleFor(p => p.Address, f => f.Address.StreetAddress())
            .RuleFor(p => p.Area, f => f.Random.Double(20, 500))
            .Generate();
    }

    private static PropertyCreateDto CreateRandomPropertyDto()
    {
        return new Faker<PropertyCreateDto>()
            .RuleFor(p => p.Title, f => f.Lorem.Sentence())
            .RuleFor(p => p.Description, f => f.Lorem.Paragraph())
            .RuleFor(p => p.Type, f => PropertyType.Apartment)
            .RuleFor(p => p.ListingType, f => ListingType.Rent)
            .RuleFor(p => p.MonthlyRent, f => f.Random.Decimal(100, 5000))
            .RuleFor(p => p.City, f => f.Address.City())
            .RuleFor(p => p.Address, f => f.Address.StreetAddress())
            .RuleFor(p => p.Area, f => f.Random.Double(20, 500))
            .Generate();
    }

    [Fact]
    public async Task AddPropertyAsync_WithValidDto_ShouldAddProperty()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var propertyDto = CreateRandomPropertyDto();
        var now = DateTimeOffset.UtcNow;

        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(userId);
        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertPropertyAsync(It.IsAny<Property>()))
            .ReturnsAsync((Property p) => p);

        // Act
        var result = await this.propertyService.AddPropertyAsync(propertyDto);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be(propertyDto.Title);
        result.HostId.Should().Be(userId);

        this.storageBrokerMock.Verify(broker => broker.InsertPropertyAsync(It.IsAny<Property>()), Times.Once);
    }

    [Fact]
    public async Task AddPropertyAsync_WhenUserNotAuthenticated_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var propertyDto = CreateRandomPropertyDto();

        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns((Guid?)null);

        // Act
        Func<Task> action = async () => await this.propertyService.AddPropertyAsync(propertyDto);

        // Assert
        await action.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RetrievePropertyByIdAsync_WhenPropertyExists_ShouldReturnProperty()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var property = CreateRandomProperty();
        property.Id = propertyId;

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);

        // Act
        var result = await this.propertyService.RetrievePropertyByIdAsync(propertyId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(propertyId);
    }

    [Fact]
    public async Task RetrievePropertyByIdAsync_WhenPropertyDoesNotExist_ShouldThrowNotFoundPropertyException()
    {
        // Arrange
        var propertyId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync((Property)null);

        // Act
        Func<Task> action = async () => await this.propertyService.RetrievePropertyByIdAsync(propertyId);

        // Assert
        await action.Should().ThrowAsync<NotFoundPropertyException>();
    }

    [Fact]
    public async Task RemovePropertyByIdAsync_WhenPropertyExistsAndUserIsHost_ShouldRemoveProperty()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var hostId = Guid.NewGuid();
        var property = CreateRandomProperty(hostId);
        property.Id = propertyId;

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(hostId);
        this.currentUserServiceMock.Setup(service => service.IsInRole("Admin"))
            .Returns(false);
        this.storageBrokerMock.Setup(broker => broker.DeletePropertyByIdAsync(propertyId))
            .ReturnsAsync(property);

        // Act
        var result = await this.propertyService.RemovePropertyByIdAsync(propertyId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(propertyId);
        this.storageBrokerMock.Verify(broker => broker.DeletePropertyByIdAsync(propertyId), Times.Once);
    }

    [Fact]
    public async Task RemovePropertyByIdAsync_WhenUserIsNotHostOrAdmin_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var property = CreateRandomProperty();
        property.Id = propertyId;

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(Guid.NewGuid()); // Different user
        this.currentUserServiceMock.Setup(service => service.IsInRole("Admin"))
            .Returns(false);

        // Act
        Func<Task> action = async () => await this.propertyService.RemovePropertyByIdAsync(propertyId);

        // Assert
        var exception = await action.Should().ThrowAsync<PropertyServiceException>();
        exception.WithInnerException<FailedPropertyServiceException>()
            .WithInnerException<UnauthorizedAccessException>();
    }
}
