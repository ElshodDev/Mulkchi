using System;
using System.Threading.Tasks;
using Bogus;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Models.Foundations.Notifications.Exceptions;
using Mulkchi.Api.Services.Foundations.Notifications;

namespace Mulkchi.Api.Tests.Application.Services;

/// <summary>
/// NotificationService unit testlari.
/// Xabar yaratish, o'qish va o'chirish logikasini tekshiradi.
/// </summary>
public class NotificationServiceTests
{
    private readonly Mock<IStorageBroker> storageBroker = new();
    private readonly Mock<ILoggingBroker> loggingBroker = new();
    private readonly Mock<IDateTimeBroker> dateTimeBroker = new();

    private static readonly DateTimeOffset FixedDate =
        new(2026, 5, 14, 12, 0, 0, TimeSpan.Zero);

    public NotificationServiceTests()
    {
        this.dateTimeBroker
            .Setup(b => b.GetCurrentDateTimeOffset())
            .Returns(FixedDate);
    }

    // ──────────────────────────────────────────
    // AddNotificationAsync
    // ──────────────────────────────────────────

    [Fact]
    public async Task AddNotificationAsync_WithValidNotification_ReturnsNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TitleUz = "Bron so'rovi",
            TitleRu = "Запрос бронирования",
            TitleEn = "Booking request",
            BodyUz = "Sizning broniz tasdiqlandi",
            BodyRu = "Ваше бронирование подтверждено",
            BodyEn = "Your booking is confirmed",
            Type = NotificationType.BookingRequest,
            IsRead = false
        };

        this.storageBroker
            .Setup(b => b.InsertNotificationAsync(It.IsAny<Notification>()))
            .ReturnsAsync((Notification n) => n);

        var service = CreateNotificationService();

        // Act
        Notification result = await service.AddNotificationAsync(notification);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(notification.Id);
        result.UserId.Should().Be(userId);
        result.TitleUz.Should().Be("Bron so'rovi");
        result.Type.Should().Be(NotificationType.BookingRequest);
        result.IsRead.Should().BeFalse();
        result.CreatedDate.Should().Be(FixedDate);
        result.UpdatedDate.Should().Be(FixedDate);

        this.storageBroker.Verify(b => b.InsertNotificationAsync(It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public async Task AddNotificationAsync_WithNullUserId_ThrowsNotificationValidationException()
    {
        // Arrange — UserId = Guid.Empty bo'lsa validation xatosi
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Empty, // Noto'g'ri
            TitleUz = "Test",
            BodyUz = "Test body",
            Type = NotificationType.SystemAlert,
            IsRead = false
        };

        var service = CreateNotificationService();

        // Act
        ValueTask<Notification> action = service.AddNotificationAsync(notification);

        // Assert
        await Assert.ThrowsAsync<NotificationValidationException>(() => action.AsTask());
        this.storageBroker.Verify(b => b.InsertNotificationAsync(It.IsAny<Notification>()), Times.Never);
    }

    [Fact]
    public async Task AddNotificationAsync_WithSystemAlert_SetsTimestamps()
    {
        // Arrange
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            TitleUz = "Tizim xabari",
            BodyUz = "Yangilanish mavjud",
            Type = NotificationType.SystemAlert,
            IsRead = false
        };

        this.storageBroker
            .Setup(b => b.InsertNotificationAsync(It.IsAny<Notification>()))
            .ReturnsAsync((Notification n) => n);

        var service = CreateNotificationService();

        // Act
        Notification result = await service.AddNotificationAsync(notification);

        // Assert
        result.CreatedDate.Should().Be(FixedDate);
        result.UpdatedDate.Should().Be(FixedDate);
    }

    // ──────────────────────────────────────────
    // RetrieveNotificationByIdAsync
    // ──────────────────────────────────────────

    [Fact]
    public async Task RetrieveNotificationByIdAsync_WithExistingId_ReturnsNotification()
    {
        // Arrange
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = Guid.NewGuid(),
            TitleUz = "Test",
            BodyUz = "Test body",
            Type = NotificationType.NewMessage,
            IsRead = false,
            CreatedDate = FixedDate,
            UpdatedDate = FixedDate
        };

        this.storageBroker
            .Setup(b => b.SelectNotificationByIdAsync(notificationId))
            .ReturnsAsync(notification);

        var service = CreateNotificationService();

        // Act
        Notification result = await service.RetrieveNotificationByIdAsync(notificationId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(notificationId);
        result.Type.Should().Be(NotificationType.NewMessage);
    }

    [Fact]
    public async Task RetrieveNotificationByIdAsync_WithNonExistingId_ThrowsNotFoundNotificationException()
    {
        // Arrange
        var notificationId = Guid.NewGuid();

        this.storageBroker
            .Setup(b => b.SelectNotificationByIdAsync(notificationId))
            .ReturnsAsync((Notification?)null!);

        var service = CreateNotificationService();

        // Act
        ValueTask<Notification> action = service.RetrieveNotificationByIdAsync(notificationId);

        // Assert
        NotificationDependencyValidationException exception =
            await Assert.ThrowsAsync<NotificationDependencyValidationException>(() => action.AsTask());

        exception.InnerException.Should().BeOfType<NotFoundNotificationException>();
    }

    // ──────────────────────────────────────────
    // RemoveNotificationByIdAsync
    // ──────────────────────────────────────────

    [Fact]
    public async Task RemoveNotificationByIdAsync_WithExistingId_DeletesNotification()
    {
        // Arrange
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = Guid.NewGuid(),
            TitleUz = "O'chiriladi",
            BodyUz = "Tez orada o'chiriladi",
            Type = NotificationType.SystemAlert,
            IsRead = true,
            CreatedDate = FixedDate,
            UpdatedDate = FixedDate
        };

        this.storageBroker
            .Setup(b => b.DeleteNotificationByIdAsync(notificationId))
            .ReturnsAsync(notification);

        var service = CreateNotificationService();

        // Act
        Notification result = await service.RemoveNotificationByIdAsync(notificationId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(notificationId);
        this.storageBroker.Verify(b => b.DeleteNotificationByIdAsync(notificationId), Times.Once);
    }

    [Fact]
    public async Task RemoveNotificationByIdAsync_WithEmptyId_ThrowsNotificationValidationException()
    {
        // Arrange
        var service = CreateNotificationService();

        // Act
        ValueTask<Notification> action = service.RemoveNotificationByIdAsync(Guid.Empty);

        // Assert
        await Assert.ThrowsAsync<NotificationValidationException>(() => action.AsTask());
        this.storageBroker.Verify(b => b.DeleteNotificationByIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    // ──────────────────────────────────────────
    // ModifyNotificationAsync
    // ──────────────────────────────────────────

    [Fact]
    public async Task ModifyNotificationAsync_WithReadStatus_UpdatesNotification()
    {
        // Arrange
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = Guid.NewGuid(),
            TitleUz = "Yangilandi",
            BodyUz = "Yangilangan body",
            Type = NotificationType.BookingApproved,
            IsRead = true,
            ReadAt = FixedDate,
            CreatedDate = FixedDate,
            UpdatedDate = FixedDate
        };

        this.storageBroker
            .Setup(b => b.UpdateNotificationAsync(It.IsAny<Notification>()))
            .ReturnsAsync((Notification n) => n);

        var service = CreateNotificationService();

        // Act
        Notification result = await service.ModifyNotificationAsync(notification);

        // Assert
        result.Should().NotBeNull();
        result.IsRead.Should().BeTrue();
        result.UpdatedDate.Should().Be(FixedDate);
        this.storageBroker.Verify(b => b.UpdateNotificationAsync(It.IsAny<Notification>()), Times.Once);
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    private NotificationService CreateNotificationService() => new(
        this.storageBroker.Object,
        this.loggingBroker.Object,
        this.dateTimeBroker.Object);
}
