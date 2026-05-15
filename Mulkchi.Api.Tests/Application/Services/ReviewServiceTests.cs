using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Reviews;
using Mulkchi.Api.Models.Foundations.Reviews.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Reviews;

namespace Mulkchi.Api.Tests.Application.Services;

/// <summary>
/// ReviewService unit testlari.
/// Sharh qo'shish, o'qish, o'zgartirish va o'chirishni tekshiradi.
/// </summary>
public class ReviewServiceTests
{
    private readonly Mock<IStorageBroker> storageBroker = new();
    private readonly Mock<ILoggingBroker> loggingBroker = new();
    private readonly Mock<IDateTimeBroker> dateTimeBroker = new();
    private readonly Mock<ICurrentUserService> currentUserService = new();

    private static readonly DateTimeOffset FixedDate =
        new(2026, 5, 14, 12, 0, 0, TimeSpan.Zero);

    private static readonly Faker faker = new("en");

    public ReviewServiceTests()
    {
        this.dateTimeBroker
            .Setup(b => b.GetCurrentDateTimeOffset())
            .Returns(FixedDate);
    }

    // ──────────────────────────────────────────
    // AddReviewAsync
    // ──────────────────────────────────────────

    [Fact]
    public async Task AddReviewAsync_WithValidReview_ReturnsReview()
    {
        // Arrange
        var reviewerId = Guid.NewGuid();
        var propertyId = Guid.NewGuid();

        var review = new Review
        {
            Id = Guid.NewGuid(),
            ReviewerId = reviewerId,
            PropertyId = propertyId,
            OverallRating = 4.5m,
            CleanlinessRating = 5m,
            LocationRating = 4m,
            ValueRating = 4.5m,
            CommunicationRating = 5m,
            AccuracyRating = 4m,
            Comment = faker.Lorem.Paragraph()
        };

        var property = new Property
        {
            Id = propertyId,
            AverageRating = 0m
        };

        this.storageBroker
            .Setup(b => b.SelectAllReviews())
            .Returns(Array.Empty<Review>().AsQueryable());

        this.storageBroker
            .Setup(b => b.InsertReviewAsync(It.IsAny<Review>()))
            .ReturnsAsync((Review r) => r);

        this.storageBroker
            .Setup(b => b.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);

        this.storageBroker
            .Setup(b => b.UpdatePropertyAsync(It.IsAny<Property>()))
            .ReturnsAsync((Property p) => p);

        var service = CreateReviewService();

        // Act
        Review result = await service.AddReviewAsync(review);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(review.Id);
        result.ReviewerId.Should().Be(reviewerId);
        result.PropertyId.Should().Be(propertyId);
        result.CreatedDate.Should().Be(FixedDate);
        result.UpdatedDate.Should().Be(FixedDate);

        this.storageBroker.Verify(b => b.InsertReviewAsync(It.IsAny<Review>()), Times.Once);
    }

    [Fact]
    public async Task AddReviewAsync_WithDuplicateReview_ThrowsReviewDependencyValidationException()
    {
        // Arrange
        var reviewerId = Guid.NewGuid();
        var propertyId = Guid.NewGuid();

        var existingReview = new Review
        {
            Id = Guid.NewGuid(),
            ReviewerId = reviewerId,
            PropertyId = propertyId,
            OverallRating = 3m,
            Comment = "Existing review"
        };

        var newReview = new Review
        {
            Id = Guid.NewGuid(),
            ReviewerId = reviewerId,
            PropertyId = propertyId,
            OverallRating = 4m,
            CleanlinessRating = 4m,
            LocationRating = 4m,
            ValueRating = 4m,
            CommunicationRating = 4m,
            AccuracyRating = 4m,
            Comment = "New review"
        };

        this.storageBroker
            .Setup(b => b.SelectAllReviews())
            .Returns(new[] { existingReview }.AsQueryable());

        var service = CreateReviewService();

        // Act
        ValueTask<Review> action = service.AddReviewAsync(newReview);

        // Assert
        await Assert.ThrowsAsync<ReviewDependencyValidationException>(() => action.AsTask());
        this.storageBroker.Verify(b => b.InsertReviewAsync(It.IsAny<Review>()), Times.Never);
    }

    [Fact]
    public async Task AddReviewAsync_WithInvalidRating_ThrowsReviewValidationException()
    {
        // Arrange — rating 0 yoki manfiy bo'lsa validation xatosi
        var review = new Review
        {
            Id = Guid.NewGuid(),
            ReviewerId = Guid.NewGuid(),
            PropertyId = Guid.NewGuid(),
            OverallRating = 0m, // Noto'g'ri: 0 ball bo'lishi mumkin emas
            Comment = "Test"
        };

        this.storageBroker
            .Setup(b => b.SelectAllReviews())
            .Returns(Array.Empty<Review>().AsQueryable());

        var service = CreateReviewService();

        // Act
        ValueTask<Review> action = service.AddReviewAsync(review);

        // Assert
        await Assert.ThrowsAsync<ReviewValidationException>(() => action.AsTask());
    }

    // ──────────────────────────────────────────
    // RetrieveAllReviews
    // ──────────────────────────────────────────

    [Fact]
    public void RetrieveAllReviews_ReturnsAllReviews()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var reviews = new List<Review>
        {
            new() { Id = Guid.NewGuid(), PropertyId = propertyId, OverallRating = 5m },
            new() { Id = Guid.NewGuid(), PropertyId = propertyId, OverallRating = 4m },
        };

        this.storageBroker
            .Setup(b => b.SelectAllReviews())
            .Returns(reviews.AsQueryable());

        var service = CreateReviewService();

        // Act
        IQueryable<Review> result = service.RetrieveAllReviews();

        // Assert
        result.Should().HaveCount(2);
        result.Should().AllSatisfy(r => r.PropertyId.Should().Be(propertyId));
    }

    // ──────────────────────────────────────────
    // RetrieveReviewById
    // ──────────────────────────────────────────

    [Fact]
    public async Task RetrieveReviewByIdAsync_WithExistingId_ReturnsReview()
    {
        // Arrange
        var reviewId = Guid.NewGuid();
        var review = new Review
        {
            Id = reviewId,
            ReviewerId = Guid.NewGuid(),
            PropertyId = Guid.NewGuid(),
            OverallRating = 4.5m,
            Comment = "Ajoyib uy!"
        };

        this.storageBroker
            .Setup(b => b.SelectReviewByIdAsync(reviewId))
            .ReturnsAsync(review);

        var service = CreateReviewService();

        // Act
        Review result = await service.RetrieveReviewByIdAsync(reviewId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(reviewId);
        result.OverallRating.Should().Be(4.5m);
    }

    [Fact]
    public async Task RetrieveReviewByIdAsync_WithNonExistingId_ThrowsNotFoundReviewException()
    {
        // Arrange
        var reviewId = Guid.NewGuid();

        this.storageBroker
            .Setup(b => b.SelectReviewByIdAsync(reviewId))
            .ReturnsAsync((Review?)null);

        var service = CreateReviewService();

        // Act
        ValueTask<Review> action = service.RetrieveReviewByIdAsync(reviewId);

        // Assert
        ReviewDependencyValidationException exception =
            await Assert.ThrowsAsync<ReviewDependencyValidationException>(() => action.AsTask());

        exception.InnerException.Should().BeOfType<NotFoundReviewException>();
    }

    // ──────────────────────────────────────────
    // RemoveReviewById
    // ──────────────────────────────────────────

    [Fact]
    public async Task RemoveReviewByIdAsync_WithNonOwner_ThrowsUnauthorizedViaServiceException()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var reviewId = Guid.NewGuid();

        var existingReview = new Review
        {
            Id = reviewId,
            ReviewerId = ownerUserId, // Boshqa foydalanuvchi
            PropertyId = Guid.NewGuid(),
            OverallRating = 3m
        };

        this.currentUserService
            .Setup(s => s.GetCurrentUserId())
            .Returns(currentUserId);

        this.currentUserService
            .Setup(s => s.IsInRole("Admin"))
            .Returns(false);

        this.storageBroker
            .Setup(b => b.SelectReviewByIdAsync(reviewId))
            .ReturnsAsync(existingReview);

        var service = CreateReviewService();

        // Act
        ValueTask<Review> action = service.RemoveReviewByIdAsync(reviewId);

        // Assert
        ReviewServiceException exception =
            await Assert.ThrowsAsync<ReviewServiceException>(() => action.AsTask());

        exception.InnerException.Should().BeOfType<FailedReviewServiceException>();
        exception.InnerException!.InnerException.Should().BeOfType<UnauthorizedAccessException>();

        this.storageBroker.Verify(b => b.DeleteReviewByIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    private ReviewService CreateReviewService() => new(
        this.storageBroker.Object,
        this.loggingBroker.Object,
        this.dateTimeBroker.Object,
        this.currentUserService.Object);
}
