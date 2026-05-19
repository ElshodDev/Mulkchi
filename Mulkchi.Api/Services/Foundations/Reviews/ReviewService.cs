using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Reviews;
using Mulkchi.Api.Models.Foundations.Reviews.Exceptions;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Services.Foundations.Reviews;

public partial class ReviewService : IReviewService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ICurrentUserService currentUserService;

    public ReviewService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ICurrentUserService currentUserService)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.currentUserService = currentUserService;
    }

    public ValueTask<Review> AddReviewAsync(Review review) =>
        TryCatch(async () =>
        {
            ValidateReviewOnAdd(review);

            bool alreadyReviewed = this.storageBroker
                .SelectAllReviews()
                .Any(r => r.ReviewerId == review.ReviewerId && r.PropertyId == review.PropertyId);

            if (alreadyReviewed)
                throw new AlreadyExistsReviewException(
                    message: "Review already exists for this user and property.");

            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            review.CreatedDate = now;
            review.UpdatedDate = now;

            Review addedReview = await this.storageBroker.InsertReviewAsync(review);
            await UpdatePropertyAverageRatingAsync(review.PropertyId);
            return addedReview;
        });

    public IQueryable<Review> RetrieveAllReviews() =>
        TryCatch(() => this.storageBroker.SelectAllReviews());

    public ValueTask<Review> RetrieveReviewByIdAsync(Guid reviewId) =>
        TryCatch(async () =>
        {
            ValidateReviewId(reviewId);
            Review maybeReview = await this.storageBroker.SelectReviewByIdAsync(reviewId);

            if (maybeReview is null)
                throw new NotFoundReviewException(reviewId);

            return maybeReview;
        });

    public ValueTask<Review> ModifyReviewAsync(Review review) =>
        TryCatch(async () =>
        {
            ValidateReviewOnModify(review);
            
            // Get existing review to check ownership
            Review existingReview = await this.storageBroker.SelectReviewByIdAsync(review.Id);
            if (existingReview == null)
                throw new NotFoundReviewException(review.Id);
            
            // Check ownership: only reviewer can modify
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && existingReview.ReviewerId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only modify your own reviews.");
            }
            
            Review modifiedReview = await this.storageBroker.UpdateReviewAsync(review);
            await UpdatePropertyAverageRatingAsync(modifiedReview.PropertyId);
            return modifiedReview;
        });

    public ValueTask<Review> RemoveReviewByIdAsync(Guid reviewId) =>
        TryCatch(async () =>
        {
            ValidateReviewId(reviewId);
            
            // Get existing review to check ownership
            Review existingReview = await this.storageBroker.SelectReviewByIdAsync(reviewId);
            if (existingReview == null)
                throw new NotFoundReviewException(reviewId);
            
            // Check ownership: only reviewer can delete
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && existingReview.ReviewerId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only delete your own reviews.");
            }
            
            Review deletedReview = await this.storageBroker.DeleteReviewByIdAsync(reviewId);
            await UpdatePropertyAverageRatingAsync(deletedReview.PropertyId);
            return deletedReview;
        });

    private async ValueTask UpdatePropertyAverageRatingAsync(Guid propertyId)
    {
        var reviews = this.storageBroker.SelectAllReviews()
            .Where(r => r.PropertyId == propertyId)
            .ToList();

        decimal averageRating = reviews.Count > 0
            ? reviews.Average(r => r.OverallRating)
            : 0m;

        Property maybeProperty = await this.storageBroker.SelectPropertyByIdAsync(propertyId);
        if (maybeProperty is not null)
        {
            maybeProperty.AverageRating = averageRating;
            maybeProperty.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            await this.storageBroker.UpdatePropertyAsync(maybeProperty);
        }
    }
}
