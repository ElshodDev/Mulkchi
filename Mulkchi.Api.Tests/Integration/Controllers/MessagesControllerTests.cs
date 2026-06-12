using System;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Mulkchi.Api.Tests.Integration.Setup;
using Xunit;

namespace Mulkchi.Api.Tests.Integration.Controllers;

public class MessagesControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> factory;
    private readonly HttpClient client;

    public MessagesControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        this.factory = factory;
        this.client = factory.CreateClient();
    }

    [Fact]
    public async Task GetConversations_ShouldReturnUnauthorized_WhenNoTokenProvided()
    {
        // Act
        var response = await this.client.GetAsync("/api/messages/conversations");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    
    [Fact]
    public async Task GetConversationMessages_ShouldReturnUnauthorized_WhenNoTokenProvided()
    {
        // Arrange
        var otherUserId = Guid.NewGuid();

        // Act
        var response = await this.client.GetAsync($"/api/messages/conversation/{otherUserId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
