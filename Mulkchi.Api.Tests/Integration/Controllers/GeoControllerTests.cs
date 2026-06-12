using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Mulkchi.Api.Models.Foundations.Geo;
using Mulkchi.Api.Tests.Integration.Setup;
using Xunit;

namespace Mulkchi.Api.Tests.Integration.Controllers;

public class GeoControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> factory;
    private readonly HttpClient client;

    public GeoControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        this.factory = factory;
        this.client = factory.CreateClient();
    }

    [Fact]
    public async Task GetNearbyProperties_ShouldReturnOk_WhenParametersAreValid()
    {
        // Act
        var response = await this.client.GetAsync("/api/geo/nearby-properties?lat=41.2995&lng=69.2401&radius=5");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var properties = await response.Content.ReadFromJsonAsync<IEnumerable<PropertyMapDto>>();
        properties.Should().NotBeNull();
    }

    [Fact]
    public async Task GetNearbyProperties_ShouldReturnBadRequest_WhenRadiusIsInvalid()
    {
        // Act
        var response = await this.client.GetAsync("/api/geo/nearby-properties?lat=41.2995&lng=69.2401&radius=100");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
