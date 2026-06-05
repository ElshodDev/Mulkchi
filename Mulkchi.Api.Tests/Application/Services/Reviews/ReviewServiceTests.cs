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
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Reviews;
using Mulkchi.Api.Models.Foundations.Reviews.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Reviews;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Reviews;

public class ReviewServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly Mock<ICurrentUserService> currentUserServiceMock;
    private readonly IReviewService reviewService;

    public ReviewServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();
        this.currentUserServiceMock = new Mock<ICurrentUserService>();

        this.reviewService = new ReviewService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object,
            this.currentUserServiceMock.Object);
    }

    private static Review CreateRandomReview()
    {
        return new Faker<Review>()
            .RuleFor(r => r.Id, f => Guid.NewGuid())
            .RuleFor(r => r.PropertyId, f => Guid.NewGuid())
            .RuleFor(r => r.ReviewerId, f => Guid.NewGuid())
            .RuleFor(r => r.OverallRating, f => f.Random.Decimal(1, 5))
            .RuleFor(r => r.CleanlinessRating, f => f.Random.Decimal(1, 5))
            .RuleFor(r => r.AccuracyRating, f => f.Random.Decimal(1, 5))
            .RuleFor(r => r.CommunicationRating, f => f.Random.Decimal(1, 5))
            .RuleFor(r => r.LocationRating, f => f.Random.Decimal(1, 5))
            .RuleFor(r => r.ValueRating, f => f.Random.Decimal(1, 5))
            .RuleFor(r => r.Comment, f => f.Lorem.Paragraph())
            .RuleFor(r => r.CreatedDate, f => f.Date.PastOffset())
            .RuleFor(r => r.UpdatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddReviewAsync_WithValidReview_ShouldAddReview()
    {
        // Arrange
        var review = CreateRandomReview();
        var now = DateTimeOffset.UtcNow;
        var property = new Property { Id = review.PropertyId, AverageRating = 0m };
        var existingReviews = new List<Review> { review }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllReviews())
            .Returns(new List<Review>().AsQueryable());
        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertReviewAsync(review))
            .ReturnsAsync(review);
        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(review.PropertyId))
            .ReturnsAsync(property);

        // We setup SelectAllReviews again to return the list with the newly added review 
        // to correctly calculate the AverageRating during UpdatePropertyAverageRatingAsync.
        // Actually, Moq will return the last setup for the same arguments. 
        // We can just use a sequence setup or return the existing list.
        this.storageBrokerMock.SetupSequence(broker => broker.SelectAllReviews())
            .Returns(new List<Review>().AsQueryable()) // First call for AlreadyReviewed check
            .Returns(existingReviews);                 // Second call for AverageRating calculation

        // Act
        var result = await this.reviewService.AddReviewAsync(review);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(review.Id);

        this.storageBrokerMock.Verify(broker => broker.InsertReviewAsync(It.IsAny<Review>()), Times.Once);
        this.storageBrokerMock.Verify(broker => broker.UpdatePropertyAsync(It.IsAny<Property>()), Times.Once);
    }

    [Fact]
    public async Task AddReviewAsync_WhenReviewAlreadyExists_ShouldThrowAlreadyExistsReviewException()
    {
        // Arrange
        var review = CreateRandomReview();
        var existingReviews = new List<Review> { review }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllReviews())
            .Returns(existingReviews);

        // Act
        Func<Task> action = async () => await this.reviewService.AddReviewAsync(review);

        // Assert
        var exception = await action.Should().ThrowAsync<ReviewDependencyValidationException>();
        exception.WithInnerException<AlreadyExistsReviewException>();
    }

    [Fact]
    public void RetrieveAllReviews_ShouldReturnReviews()
    {
        // Arrange
        var reviews = new List<Review>
        {
            CreateRandomReview(),
            CreateRandomReview()
        }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllReviews())
            .Returns(reviews);

        // Act
        var result = this.reviewService.RetrieveAllReviews();

        // Assert
        result.Should().NotBeNull();
        result.Count().Should().Be(2);
    }

    [Fact]
    public async Task RetrieveReviewByIdAsync_WhenReviewExists_ShouldReturnReview()
    {
        // Arrange
        var reviewId = Guid.NewGuid();
        var review = CreateRandomReview();
        review.Id = reviewId;

        this.storageBrokerMock.Setup(broker => broker.SelectReviewByIdAsync(reviewId))
            .ReturnsAsync(review);

        // Act
        var result = await this.reviewService.RetrieveReviewByIdAsync(reviewId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(reviewId);
    }

    [Fact]
    public async Task RetrieveReviewByIdAsync_WhenReviewDoesNotExist_ShouldThrowNotFoundReviewException()
    {
        // Arrange
        var reviewId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectReviewByIdAsync(reviewId))
            .ReturnsAsync((Review)null);

        // Act
        Func<Task> action = async () => await this.reviewService.RetrieveReviewByIdAsync(reviewId);

        // Assert
        var exception = await action.Should().ThrowAsync<ReviewDependencyValidationException>();
        exception.WithInnerException<NotFoundReviewException>();
    }

    [Fact]
    public async Task ModifyReviewAsync_WithValidReviewAndUserOwnsIt_ShouldModifyReview()
    {
        // Arrange
        var review = CreateRandomReview();
        var property = new Property { Id = review.PropertyId, AverageRating = 0m };
        var existingReviews = new List<Review> { review }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectReviewByIdAsync(review.Id))
            .ReturnsAsync(review);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(review.ReviewerId);
        this.storageBrokerMock.Setup(broker => broker.UpdateReviewAsync(review))
            .ReturnsAsync(review);
        this.storageBrokerMock.Setup(broker => broker.SelectAllReviews())
            .Returns(existingReviews);
        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(review.PropertyId))
            .ReturnsAsync(property);

        // Act
        var result = await this.reviewService.ModifyReviewAsync(review);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(review.Id);

        this.storageBrokerMock.Verify(broker => broker.UpdateReviewAsync(It.IsAny<Review>()), Times.Once);
        this.storageBrokerMock.Verify(broker => broker.UpdatePropertyAsync(It.IsAny<Property>()), Times.Once);
    }

    [Fact]
    public async Task ModifyReviewAsync_WhenUserDoesNotOwnIt_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var review = CreateRandomReview();

        this.storageBrokerMock.Setup(broker => broker.SelectReviewByIdAsync(review.Id))
            .ReturnsAsync(review);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(Guid.NewGuid()); // Different user

        // Act
        Func<Task> action = async () => await this.reviewService.ModifyReviewAsync(review);

        // Assert
        var exception = await action.Should().ThrowAsync<ReviewDependencyValidationException>();
        exception.WithInnerException<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RemoveReviewByIdAsync_WhenReviewExistsAndUserOwnsIt_ShouldRemoveReview()
    {
        // Arrange
        var reviewId = Guid.NewGuid();
        var review = CreateRandomReview();
        review.Id = reviewId;
        var property = new Property { Id = review.PropertyId, AverageRating = 0m };
        var existingReviews = new List<Review>().AsQueryable(); // After delete, list is empty

        this.storageBrokerMock.Setup(broker => broker.SelectReviewByIdAsync(reviewId))
            .ReturnsAsync(review);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(review.ReviewerId);
        this.storageBrokerMock.Setup(broker => broker.DeleteReviewByIdAsync(reviewId))
            .ReturnsAsync(review);
        this.storageBrokerMock.Setup(broker => broker.SelectAllReviews())
            .Returns(existingReviews);
        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(review.PropertyId))
            .ReturnsAsync(property);

        // Act
        var result = await this.reviewService.RemoveReviewByIdAsync(reviewId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(reviewId);

        this.storageBrokerMock.Verify(broker => broker.DeleteReviewByIdAsync(reviewId), Times.Once);
        this.storageBrokerMock.Verify(broker => broker.UpdatePropertyAsync(It.IsAny<Property>()), Times.Once);
    }

    [Fact]
    public async Task RemoveReviewByIdAsync_WhenReviewDoesNotExist_ShouldThrowNotFoundReviewException()
    {
        // Arrange
        var reviewId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectReviewByIdAsync(reviewId))
            .ReturnsAsync((Review)null);

        // Act
        Func<Task> action = async () => await this.reviewService.RemoveReviewByIdAsync(reviewId);

        // Assert
        var exception = await action.Should().ThrowAsync<ReviewDependencyValidationException>();
        exception.WithInnerException<NotFoundReviewException>();
    }
}
