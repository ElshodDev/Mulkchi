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
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Models.Foundations.Notifications.Exceptions;
using Mulkchi.Api.Services.Foundations.Notifications;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Notifications;

public class NotificationServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly INotificationService notificationService;

    public NotificationServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();

        this.notificationService = new NotificationService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object);
    }

    private static Notification CreateRandomNotification()
    {
        return new Faker<Notification>()
            .RuleFor(n => n.Id, f => Guid.NewGuid())
            .RuleFor(n => n.UserId, f => Guid.NewGuid())
            .RuleFor(n => n.Type, f => NotificationType.SystemAlert)
            .RuleFor(n => n.TitleUz, f => f.Lorem.Sentence())
            .RuleFor(n => n.BodyUz, f => f.Lorem.Paragraph())
            .RuleFor(n => n.IsRead, f => f.Random.Bool())
            .RuleFor(n => n.CreatedDate, f => f.Date.PastOffset())
            .RuleFor(n => n.UpdatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddNotificationAsync_WithValidNotification_ShouldAddNotification()
    {
        // Arrange
        var notification = CreateRandomNotification();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertNotificationAsync(notification))
            .ReturnsAsync(notification);

        // Act
        var result = await this.notificationService.AddNotificationAsync(notification);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(notification.Id);

        this.storageBrokerMock.Verify(broker => broker.InsertNotificationAsync(It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public void RetrieveAllNotifications_ShouldReturnNotifications()
    {
        // Arrange
        var notifications = new List<Notification>
        {
            CreateRandomNotification(),
            CreateRandomNotification()
        }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllNotifications())
            .Returns(notifications);

        // Act
        var result = this.notificationService.RetrieveAllNotifications();

        // Assert
        result.Should().NotBeNull();
        result.Count().Should().Be(2);
    }

    [Fact]
    public async Task RetrieveNotificationByIdAsync_WhenNotificationExists_ShouldReturnNotification()
    {
        // Arrange
        var notificationId = Guid.NewGuid();
        var notification = CreateRandomNotification();
        notification.Id = notificationId;

        this.storageBrokerMock.Setup(broker => broker.SelectNotificationByIdAsync(notificationId))
            .ReturnsAsync(notification);

        // Act
        var result = await this.notificationService.RetrieveNotificationByIdAsync(notificationId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(notificationId);
    }

    [Fact]
    public async Task RetrieveNotificationByIdAsync_WhenNotificationDoesNotExist_ShouldThrowNotFoundNotificationException()
    {
        // Arrange
        var notificationId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectNotificationByIdAsync(notificationId))
            .ReturnsAsync((Notification)null);

        // Act
        Func<Task> action = async () => await this.notificationService.RetrieveNotificationByIdAsync(notificationId);

        // Assert
        var exception = await action.Should().ThrowAsync<NotificationDependencyValidationException>();
        exception.WithInnerException<NotFoundNotificationException>();
    }

    [Fact]
    public async Task ModifyNotificationAsync_WithValidNotification_ShouldModifyNotification()
    {
        // Arrange
        var notification = CreateRandomNotification();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.UpdateNotificationAsync(notification))
            .ReturnsAsync(notification);

        // Act
        var result = await this.notificationService.ModifyNotificationAsync(notification);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(notification.Id);

        this.storageBrokerMock.Verify(broker => broker.UpdateNotificationAsync(It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public async Task RemoveNotificationByIdAsync_WhenNotificationExists_ShouldRemoveNotification()
    {
        // Arrange
        var notificationId = Guid.NewGuid();
        var notification = CreateRandomNotification();
        notification.Id = notificationId;

        this.storageBrokerMock.Setup(broker => broker.DeleteNotificationByIdAsync(notificationId))
            .ReturnsAsync(notification);

        // Act
        var result = await this.notificationService.RemoveNotificationByIdAsync(notificationId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(notificationId);

        this.storageBrokerMock.Verify(broker => broker.DeleteNotificationByIdAsync(notificationId), Times.Once);
    }
}
