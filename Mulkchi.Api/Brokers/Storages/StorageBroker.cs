using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Mulkchi.Api.Models.Foundations.AIs;
using Mulkchi.Api.Models.Foundations.Announcements;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Boosts;
using Mulkchi.Api.Models.Foundations.Discounts;
using Mulkchi.Api.Models.Foundations.Subscriptions;
using Mulkchi.Api.Models.Foundations.Amenities;
using Mulkchi.Api.Models.Foundations.Chat;
using Mulkchi.Api.Models.Foundations.Favorites;
using Mulkchi.Api.Models.Foundations.HomeRequests;
using Mulkchi.Api.Models.Foundations.Messages;
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Models.Foundations.Outbox;
using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.PropertyViews;
using Mulkchi.Api.Models.Foundations.RentalContracts;
using Mulkchi.Api.Models.Foundations.Reviews;
using Mulkchi.Api.Models.Foundations.SavedSearches;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker : DbContext, IStorageBroker
{
    private readonly IConfiguration configuration;
    private readonly IWebHostEnvironment environment;

    public StorageBroker(
        DbContextOptions<StorageBroker> options,
        IConfiguration configuration,
        IWebHostEnvironment environment)
        : base(options)
    {
        this.configuration = configuration;
        this.environment = environment;
        // Database migrations must be applied via a dedicated startup task or
        // init container (e.g. `dotnet ef database update`), not inside the
        // DbContext constructor.  Running Migrate() here causes race conditions
        // when multiple API instances start simultaneously.
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AiRecommendation>(entity =>
        {
            entity.Property(p => p.Score).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Discount>(entity =>
        {
            entity.Property(p => p.Value).HasPrecision(18, 2);
            entity.Property(p => p.MaxDiscountAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<DiscountUsage>(entity =>
        {
            entity.Property(p => p.AmountSaved).HasPrecision(18, 2);
        });

        modelBuilder.Entity<HomeRequest>(entity =>
        {
            entity.Property(p => p.TotalPrice).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(p => p.Amount).HasPrecision(18, 2);
            entity.Property(p => p.PlatformFee).HasPrecision(18, 2);
            entity.Property(p => p.HostReceives).HasPrecision(18, 2);
            entity.Property(p => p.IdempotencyKey).HasMaxLength(128);
            // Filtered unique index: enforce idempotency key uniqueness only when set
            entity.HasIndex(p => p.IdempotencyKey)
                .IsUnique()
                .HasFilter("[IdempotencyKey] IS NOT NULL");
            entity.HasIndex(p => p.BookingId);
            entity.HasIndex(p => p.ExternalTransactionId)
                .IsUnique()
                .HasFilter("[ExternalTransactionId] IS NOT NULL");
        });

        modelBuilder.Entity<Property>(entity =>
        {
            entity.Property(p => p.MonthlyRent).HasPrecision(18, 2);
            entity.Property(p => p.SalePrice).HasPrecision(18, 2);
            entity.Property(p => p.PricePerNight).HasPrecision(18, 2);
            entity.Property(p => p.SecurityDeposit).HasPrecision(18, 2);
            entity.Property(p => p.AverageRating).HasPrecision(18, 2);
            entity.Property(p => p.ExchangeRate).HasPrecision(18, 6);
            
            // Add performance indexes
            entity.HasIndex(p => p.HostId);
            entity.HasIndex(p => p.Region);
            entity.HasIndex(p => p.Status);
            entity.HasIndex(p => p.ListingType);
            entity.HasIndex(p => p.CreatedDate);
            entity.HasIndex(p => new { p.Region, p.Status, p.ListingType });
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(p => p.TotalPrice).HasPrecision(18, 2);
            
            // Add performance indexes
            entity.HasIndex(p => p.PropertyId);
            entity.HasIndex(p => p.GuestId);
            entity.HasIndex(p => p.Status);
            entity.HasIndex(p => p.CheckInDate);
            entity.HasIndex(p => p.CheckOutDate);
            entity.HasIndex(p => new { p.PropertyId, p.CheckInDate, p.CheckOutDate, p.Status });
        });

        // BookingHold — no soft delete, purged via DeleteExpiredBookingHoldsAsync
        modelBuilder.Entity<BookingHold>(entity =>
        {
            entity.HasIndex(p => p.PropertyId);
            entity.HasIndex(p => p.ExpiresAt);
            entity.HasIndex(p => new { p.PropertyId, p.ExpiresAt });
        });

        modelBuilder.Entity<RentalContract>(entity =>
        {
            entity.Property(p => p.MonthlyRent).HasPrecision(18, 2);
            entity.Property(p => p.SecurityDeposit).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(p => p.OverallRating).HasPrecision(18, 2);
            entity.Property(p => p.CleanlinessRating).HasPrecision(18, 2);
            entity.Property(p => p.LocationRating).HasPrecision(18, 2);
            entity.Property(p => p.ValueRating).HasPrecision(18, 2);
            entity.Property(p => p.CommunicationRating).HasPrecision(18, 2);
            entity.Property(p => p.AccuracyRating).HasPrecision(18, 2);
            
            // Add performance indexes
            entity.HasIndex(p => p.PropertyId);
            entity.HasIndex(p => p.ReviewerId);
        });

        modelBuilder.Entity<SavedSearch>(entity =>
        {
            entity.Property(e => e.MaxPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.MinPrice).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(p => p.Rating).HasPrecision(18, 2);
            entity.Property(p => p.ResponseRate).HasPrecision(18, 2);
            
            // Add performance indexes
            entity.HasIndex(p => p.Email).IsUnique();
            entity.HasIndex(p => p.Role);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            // Individual indexes kept for single-column queries
            entity.HasIndex(p => p.SenderId);
            entity.HasIndex(p => p.ReceiverId);
            // Compound index for conversation queries (SenderId, ReceiverId, date-ordered)
            entity.HasIndex(p => new { p.SenderId, p.ReceiverId, p.CreatedDate });
        });

        modelBuilder.Entity<Favorite>(entity =>
        {
            // Add performance indexes
            entity.HasIndex(p => new { p.UserId, p.PropertyId }).IsUnique();
        });

        modelBuilder.Entity<Boost>(entity =>
        {
            entity.Property(p => p.Amount).HasPrecision(18, 2);
            entity.HasIndex(p => p.PropertyId);
            entity.HasIndex(p => p.UserId);
            entity.HasIndex(p => p.Status);
            entity.HasIndex(p => p.EndDate);
            entity.HasIndex(p => new { p.Status, p.EndDate });
        });

        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.Property(x => x.Type).HasMaxLength(256);
            entity.HasIndex(x => x.CreatedDate);
            entity.HasIndex(x => x.ProcessedDate);
        });

        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.Property(p => p.MonthlyPrice).HasPrecision(18, 2);
            entity.HasIndex(p => p.Name).IsUnique();
            entity.HasIndex(p => p.IsActive);
        });

        modelBuilder.Entity<UserSubscription>(entity =>
        {
            entity.HasIndex(p => p.UserId);
            entity.HasIndex(p => p.Status);
            entity.HasIndex(p => p.EndDate);
            entity.HasIndex(p => new { p.UserId, p.Status });
        });

        modelBuilder.Entity<AiRecommendation>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Announcement>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Boost>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<UserSubscription>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Amenity>().HasQueryFilter(e => e.IsActive);
        modelBuilder.Entity<Amenity>(entity =>
        {
            entity.HasIndex(a => a.IsActive);
            entity.HasIndex(a => a.Category);
            entity.HasIndex(a => a.DisplayOrder);
        });
        modelBuilder.Entity<PropertyAmenity>(entity =>
        {
            entity.HasKey(pa => new { pa.PropertyId, pa.AmenityId });
            entity.HasIndex(pa => pa.PropertyId);
            entity.HasIndex(pa => pa.AmenityId);
        });
        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.UserId);
            entity.HasIndex(s => s.IsActive);
        });
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasIndex(m => m.SessionId);
            entity.HasIndex(m => m.CreatedDate);
        });
        modelBuilder.Entity<Discount>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<DiscountUsage>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Favorite>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<HomeRequest>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Message>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Notification>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Payment>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Property>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<PropertyImage>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<PropertyView>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<RentalContract>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<Review>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<SavedSearch>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<User>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<UserRefreshToken>().HasQueryFilter(e => e.ExpiresAt > DateTimeOffset.UtcNow);
        modelBuilder.Entity<Booking>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<PasswordResetToken>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<EmailVerificationToken>().HasQueryFilter(e => e.DeletedDate == null);
        modelBuilder.Entity<PhoneOtp>().HasQueryFilter(e => e.DeletedDate == null);
    }

    // DbSet<Booking> Bookings property is defined in StorageBroker.Bookings.cs partial class.
}
