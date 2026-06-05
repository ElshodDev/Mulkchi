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
using Mulkchi.Api.Models.Foundations.Messages;
using Mulkchi.Api.Models.Foundations.Messages.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Messages;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Messages;

public class MessageServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly Mock<ICurrentUserService> currentUserServiceMock;
    private readonly IMessageService messageService;

    public MessageServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();
        this.currentUserServiceMock = new Mock<ICurrentUserService>();

        this.messageService = new MessageService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object,
            this.currentUserServiceMock.Object);
    }

    private static Message CreateRandomMessage()
    {
        return new Faker<Message>()
            .RuleFor(m => m.Id, f => Guid.NewGuid())
            .RuleFor(m => m.SenderId, f => Guid.NewGuid())
            .RuleFor(m => m.ReceiverId, f => Guid.NewGuid())
            .RuleFor(m => m.Content, f => f.Lorem.Sentence())
            .RuleFor(m => m.IsRead, f => f.Random.Bool())
            .RuleFor(m => m.CreatedDate, f => f.Date.PastOffset())
            .RuleFor(m => m.UpdatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddMessageAsync_WithValidMessage_ShouldAddMessage()
    {
        // Arrange
        var message = CreateRandomMessage();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertMessageAsync(message))
            .ReturnsAsync(message);

        // Act
        var result = await this.messageService.AddMessageAsync(message);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(message.Id);

        this.storageBrokerMock.Verify(broker => broker.InsertMessageAsync(It.IsAny<Message>()), Times.Once);
    }

    [Fact]
    public void RetrieveAllMessages_ShouldReturnMessages()
    {
        // Arrange
        var messages = new List<Message>
        {
            CreateRandomMessage(),
            CreateRandomMessage()
        }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllMessages())
            .Returns(messages);

        // Act
        var result = this.messageService.RetrieveAllMessages();

        // Assert
        result.Should().NotBeNull();
        result.Count().Should().Be(2);
    }

    [Fact]
    public async Task RetrieveMessageByIdAsync_WhenMessageExistsAndUserIsSender_ShouldReturnMessage()
    {
        // Arrange
        var messageId = Guid.NewGuid();
        var message = CreateRandomMessage();
        message.Id = messageId;

        this.storageBrokerMock.Setup(broker => broker.SelectMessageByIdAsync(messageId))
            .ReturnsAsync(message);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(message.SenderId);
        this.currentUserServiceMock.Setup(service => service.IsInRole("Admin"))
            .Returns(false);

        // Act
        var result = await this.messageService.RetrieveMessageByIdAsync(messageId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(messageId);
    }

    [Fact]
    public async Task RetrieveMessageByIdAsync_WhenUserIsNotSenderOrReceiver_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var messageId = Guid.NewGuid();
        var message = CreateRandomMessage();
        message.Id = messageId;

        this.storageBrokerMock.Setup(broker => broker.SelectMessageByIdAsync(messageId))
            .ReturnsAsync(message);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(Guid.NewGuid()); // Different user
        this.currentUserServiceMock.Setup(service => service.IsInRole("Admin"))
            .Returns(false);

        // Act
        Func<Task> action = async () => await this.messageService.RetrieveMessageByIdAsync(messageId);

        // Assert - UnauthorizedAccessException is caught by generic catch -> MessageServiceException
        await action.Should().ThrowAsync<MessageServiceException>();
    }

    [Fact]
    public async Task ModifyMessageAsync_WithValidMessageAndUserIsSender_ShouldModifyMessage()
    {
        // Arrange
        var message = CreateRandomMessage();
        var now = DateTimeOffset.UtcNow;

        this.storageBrokerMock.Setup(broker => broker.SelectMessageByIdAsync(message.Id))
            .ReturnsAsync(message);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(message.SenderId);
        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.UpdateMessageAsync(message))
            .ReturnsAsync(message);

        // Act
        var result = await this.messageService.ModifyMessageAsync(message);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(message.Id);

        this.storageBrokerMock.Verify(broker => broker.UpdateMessageAsync(It.IsAny<Message>()), Times.Once);
    }

    [Fact]
    public async Task ModifyMessageAsync_WhenUserIsNotSender_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var message = CreateRandomMessage();

        this.storageBrokerMock.Setup(broker => broker.SelectMessageByIdAsync(message.Id))
            .ReturnsAsync(message);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(message.ReceiverId); // Receiver cannot modify

        // Act
        Func<Task> action = async () => await this.messageService.ModifyMessageAsync(message);

        // Assert - UnauthorizedAccessException is caught by generic catch -> MessageServiceException
        // The inner of MessageServiceException is FailedMessageServiceException which wraps UnauthorizedAccessException
        await action.Should().ThrowAsync<MessageServiceException>();
    }

    [Fact]
    public async Task RemoveMessageByIdAsync_WhenMessageExistsAndUserIsSender_ShouldRemoveMessage()
    {
        // Arrange
        var messageId = Guid.NewGuid();
        var message = CreateRandomMessage();
        message.Id = messageId;

        this.storageBrokerMock.Setup(broker => broker.SelectMessageByIdAsync(messageId))
            .ReturnsAsync(message);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(message.SenderId);
        this.storageBrokerMock.Setup(broker => broker.DeleteMessageByIdAsync(messageId))
            .ReturnsAsync(message);

        // Act
        var result = await this.messageService.RemoveMessageByIdAsync(messageId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(messageId);

        this.storageBrokerMock.Verify(broker => broker.DeleteMessageByIdAsync(messageId), Times.Once);
    }

    [Fact]
    public async Task RemoveMessageByIdAsync_WhenMessageDoesNotExist_ShouldThrowNotFoundMessageException()
    {
        // Arrange
        var messageId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectMessageByIdAsync(messageId))
            .ReturnsAsync((Message)null);

        // Act
        Func<Task> action = async () => await this.messageService.RemoveMessageByIdAsync(messageId);

        // Assert - NotFoundMessageException is caught -> wrapped in MessageDependencyValidationException
        var exception = await action.Should().ThrowAsync<MessageDependencyValidationException>();
        exception.WithInnerException<NotFoundMessageException>();
    }
}
