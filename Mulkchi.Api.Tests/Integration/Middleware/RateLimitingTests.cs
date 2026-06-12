using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

using Mulkchi.Api.Tests.Integration.Setup;

namespace Mulkchi.Api.Tests.Integration.Middleware;

public class RateLimitingTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> factory;

    public RateLimitingTests(CustomWebApplicationFactory<Program> factory)
    {
        this.factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, configBuilder) =>
            {
                configBuilder.AddInMemoryCollection(new[]
                {
                    new KeyValuePair<string, string?>("RateLimiting:Enabled", "true"),
                    new KeyValuePair<string, string?>("RateLimiting:General", "2"),
                    new KeyValuePair<string, string?>("RateLimiting:WindowSeconds", "60")
                });
            });
        });
    }

    [Fact]
    public async Task GeneralEndpoint_ShouldReturnTooManyRequests_WhenLimitExceeded()
    {
        // Arrange
        var client = this.factory.CreateClient();
        string url = "/api/geo/properties-map";

        // Act
        var response1 = await client.GetAsync(url);
        var response2 = await client.GetAsync(url);
        var response3 = await client.GetAsync(url);

        // Assert
        // First two should not be rate limited
        response1.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
        response2.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
        
        // Third should be rate limited since MaxRequests = 2
        response3.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }
}
