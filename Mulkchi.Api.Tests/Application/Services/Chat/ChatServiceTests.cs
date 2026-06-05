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
using Mulkchi.Api.Models.Foundations.Chat;
using Mulkchi.Api.Models.Foundations.Compare;
using Mulkchi.Api.Services.Foundations.Chat;
using Mulkchi.Api.Services.Foundations.Compare;
using Xunit;
// Oh wait, GetUserSessionsAsync uses ToListAsync. I will just test StartSessionAsync, EndSessionAsync, DetectIntentAsync which do not use async extensions on IQueryable.

namespace Mulkchi.Api.Tests.Application.Services.Chat;

public class ChatServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly Mock<ICompareService> compareServiceMock;
    private readonly IChatService chatService;

    public ChatServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();
        this.compareServiceMock = new Mock<ICompareService>();

        this.chatService = new ChatService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object,
            this.compareServiceMock.Object);
    }

    [Fact]
    public async Task StartSessionAsync_ShouldCreateAndReturnSession()
    {
        // Arrange
        Guid? userId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertChatSessionAsync(It.IsAny<ChatSession>()))
            .ReturnsAsync((ChatSession session) => session);

        // Act
        var result = await this.chatService.StartSessionAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(userId);
        result.IsActive.Should().BeTrue();
        result.CreatedDate.Should().Be(now);

        this.storageBrokerMock.Verify(broker => broker.InsertChatSessionAsync(It.IsAny<ChatSession>()), Times.Once);
    }

    [Fact]
    public async Task EndSessionAsync_WhenSessionExists_ShouldDeactivateSession()
    {
        // Arrange
        var sessionId = "chat_123";
        var session = new ChatSession { Id = sessionId, IsActive = true };
        var now = DateTimeOffset.UtcNow;

        this.storageBrokerMock.Setup(broker => broker.SelectChatSessionByIdAsync(sessionId))
            .ReturnsAsync(session);
        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.UpdateChatSessionAsync(It.IsAny<ChatSession>()))
            .ReturnsAsync(session);

        // Act
        await this.chatService.EndSessionAsync(sessionId);

        // Assert
        session.IsActive.Should().BeFalse();
        session.EndedDate.Should().Be(now);

        this.storageBrokerMock.Verify(broker => broker.UpdateChatSessionAsync(session), Times.Once);
    }

    [Theory]
    [InlineData("uylarni taqqoslab bering", "compare")]
    [InlineData("bu uylarni solishtir", "compare")]
    [InlineData("arzonroq qidiring", "search")]
    [InlineData("toshkentdan uylar top", "search")]
    [InlineData("narxi qancha?", "price")]
    [InlineData("salom", "general")]
    public async Task DetectIntentAsync_ShouldReturnExpectedIntent(string message, string expectedIntent)
    {
        // Act
        var result = await this.chatService.DetectIntentAsync(message);

        // Assert
        result.Should().Be(expectedIntent);
    }
}
