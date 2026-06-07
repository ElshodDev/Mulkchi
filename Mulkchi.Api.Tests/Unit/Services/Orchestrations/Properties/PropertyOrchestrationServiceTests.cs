using System;
using System.Linq;
using System.Security.Claims;
using Bogus;
using Moq;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Tokens;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.SavedSearches;
using Mulkchi.Api.Models.Foundations.Favorites;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Favorites;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.SavedSearches;
using Mulkchi.Api.Services.Foundations.Users;
using Mulkchi.Api.Services.Orchestrations.Properties;

namespace Mulkchi.Api.Tests.Unit.Services.Orchestrations.Properties;

public partial class PropertyOrchestrationServiceTests
{
    private readonly Mock<IPropertyService> propertyServiceMock;
    private readonly Mock<IUserService> userServiceMock;
    private readonly Mock<IAuthService> authServiceMock;
    private readonly Mock<ISavedSearchService> savedSearchServiceMock;
    private readonly Mock<IFavoriteService> favoriteServiceMock;
    private readonly Mock<ITelegramBroker> telegramBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly IPropertyOrchestrationService propertyOrchestrationService;

    public PropertyOrchestrationServiceTests()
    {
        this.propertyServiceMock = new Mock<IPropertyService>();
        this.userServiceMock = new Mock<IUserService>();
        this.authServiceMock = new Mock<IAuthService>();
        this.savedSearchServiceMock = new Mock<ISavedSearchService>();
        this.favoriteServiceMock = new Mock<IFavoriteService>();
        this.telegramBrokerMock = new Mock<ITelegramBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();

        this.loggingBrokerMock.Setup(b => b.LogError(It.IsAny<Exception>()))
            .Callback<Exception>(ex => throw new Exception("Swallowed Exception: " + ex.Message, ex));

        this.propertyOrchestrationService = new PropertyOrchestrationService(
            propertyService: this.propertyServiceMock.Object,
            userService: this.userServiceMock.Object,
            authService: this.authServiceMock.Object,
            savedSearchService: this.savedSearchServiceMock.Object,
            favoriteService: this.favoriteServiceMock.Object,
            telegramBroker: this.telegramBrokerMock.Object,
            loggingBroker: this.loggingBrokerMock.Object);
    }

    private static Property CreateRandomProperty()
    {
        return new Faker<Property>()
            .RuleFor(p => p.Id, f => Guid.NewGuid())
            .RuleFor(p => p.Title, f => f.Lorem.Word())
            .RuleFor(p => p.ListingType, f => ListingType.Sale)
            .RuleFor(p => p.City, f => f.Address.City())
            .RuleFor(p => p.SalePrice, f => f.Random.Decimal(10000, 100000))
            .RuleFor(p => p.MonthlyRent, f => f.Random.Decimal(100, 1000))
            .Generate();
    }

    private static SavedSearch CreateRandomSavedSearch(Property property)
    {
        return new Faker<SavedSearch>()
            .RuleFor(s => s.Id, f => Guid.NewGuid())
            .RuleFor(s => s.UserId, f => Guid.NewGuid())
            .RuleFor(s => s.ListingType, f => property.ListingType)
            .RuleFor(s => s.City, f => property.City)
            .RuleFor(s => s.MinPrice, f => property.SalePrice - 1000)
            .RuleFor(s => s.MaxPrice, f => property.SalePrice + 1000)
            .Generate();
    }

    private static Favorite CreateRandomFavorite(Guid propertyId)
    {
        return new Faker<Favorite>()
            .RuleFor(f => f.Id, f => Guid.NewGuid())
            .RuleFor(f => f.UserId, f => Guid.NewGuid())
            .RuleFor(f => f.PropertyId, f => propertyId)
            .Generate();
    }

    private static User CreateRandomUserWithTelegram(Guid userId)
    {
        return new Faker<User>()
            .RuleFor(u => u.Id, f => userId)
            .RuleFor(u => u.FirstName, f => f.Name.FirstName())
            .RuleFor(u => u.TelegramId, f => f.Random.Long(100000, 999999))
            .Generate();
    }

    private static ClaimsPrincipal CreateRandomClaimsPrincipal(Guid userId)
    {
        return new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }));
    }
}
