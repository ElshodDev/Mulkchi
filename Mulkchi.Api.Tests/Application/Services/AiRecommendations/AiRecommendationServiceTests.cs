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
using Mulkchi.Api.Models.Foundations.AIs;
using Mulkchi.Api.Models.Foundations.AIs.Exceptions;
using Mulkchi.Api.Services.Foundations.AiRecommendations;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.AiRecommendations;

public class AiRecommendationServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    // Hybrid dependencies could be mocked here as well but we will just test basic operations
    private readonly IAiRecommendationService aiRecommendationService;

    public AiRecommendationServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();

        this.aiRecommendationService = new AiRecommendationService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object);
    }

    private static AiRecommendation CreateRandomAiRecommendation()
    {
        return new Faker<AiRecommendation>()
            .RuleFor(a => a.Id, f => Guid.NewGuid())
            .RuleFor(a => a.UserId, f => Guid.NewGuid())
            .RuleFor(a => a.PropertyId, f => Guid.NewGuid())
            .RuleFor(a => a.Title, f => f.Lorem.Sentence(3))
            .RuleFor(a => a.Description, f => f.Lorem.Sentence())
            .RuleFor(a => a.Score, f => f.Random.Decimal(0, 1))
            .RuleFor(a => a.CreatedDate, f => f.Date.PastOffset())
            .RuleFor(a => a.UpdatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddAiRecommendationAsync_WithValidRecommendation_ShouldAddRecommendation()
    {
        // Arrange
        var recommendation = CreateRandomAiRecommendation();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertAiRecommendationAsync(recommendation))
            .ReturnsAsync(recommendation);

        // Act
        var result = await this.aiRecommendationService.AddAiRecommendationAsync(recommendation);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(recommendation.Id);

        this.storageBrokerMock.Verify(broker => broker.InsertAiRecommendationAsync(It.IsAny<AiRecommendation>()), Times.Once);
    }

    [Fact]
    public void RetrieveAllAiRecommendations_ShouldReturnRecommendations()
    {
        // Arrange
        var recommendations = new List<AiRecommendation>
        {
            CreateRandomAiRecommendation(),
            CreateRandomAiRecommendation()
        }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllAiRecommendations())
            .Returns(recommendations);

        // Act
        var result = this.aiRecommendationService.RetrieveAllAiRecommendations();

        // Assert
        result.Should().NotBeNull();
        result.Count().Should().Be(2);
    }

    [Fact]
    public async Task RetrieveAiRecommendationByIdAsync_WhenRecommendationExists_ShouldReturnRecommendation()
    {
        // Arrange
        var recommendationId = Guid.NewGuid();
        var recommendation = CreateRandomAiRecommendation();
        recommendation.Id = recommendationId;

        this.storageBrokerMock.Setup(broker => broker.SelectAiRecommendationByIdAsync(recommendationId))
            .ReturnsAsync(recommendation);

        // Act
        var result = await this.aiRecommendationService.RetrieveAiRecommendationByIdAsync(recommendationId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(recommendationId);
    }

    [Fact]
    public async Task RemoveAiRecommendationByIdAsync_WhenRecommendationExists_ShouldRemoveRecommendation()
    {
        // Arrange
        var recommendationId = Guid.NewGuid();
        var recommendation = CreateRandomAiRecommendation();
        recommendation.Id = recommendationId;

        this.storageBrokerMock.Setup(broker => broker.SelectAiRecommendationByIdAsync(recommendationId))
            .ReturnsAsync(recommendation);
        this.storageBrokerMock.Setup(broker => broker.DeleteAiRecommendationByIdAsync(recommendationId))
            .ReturnsAsync(recommendation);

        // Act
        var result = await this.aiRecommendationService.RemoveAiRecommendationByIdAsync(recommendationId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(recommendationId);

        this.storageBrokerMock.Verify(broker => broker.DeleteAiRecommendationByIdAsync(recommendationId), Times.Once);
    }
}
