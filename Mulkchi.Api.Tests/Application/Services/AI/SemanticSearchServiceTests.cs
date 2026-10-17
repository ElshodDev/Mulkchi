using System.Threading.Tasks;
using FluentAssertions;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.AI;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.AI
{
    public class SemanticSearchServiceTests
    {
        private readonly ISemanticSearchService semanticSearchService;

        public SemanticSearchServiceTests()
        {
            this.semanticSearchService = new SemanticSearchService();
        }

        [Fact]
        public async Task ParseQueryAsync_ShouldExtractDistrictRoomsPriceAndListingType()
        {
            // Given
            string query = "Chilonzorda 3 xonali 500$ gacha ijara kvartira";

            // When
            PropertySearchParams result = await this.semanticSearchService.ParseQueryAsync(query);

            // Then
            result.District.Should().Be("Chilonzor");
            result.Region.Should().Be("ToshkentShahar");
            result.Bedrooms.Should().Be(3);
            result.MaxPrice.Should().Be(500m);
            result.ListingType.Should().Be(ListingType.Rent);
            result.PropertyType.Should().Be(PropertyType.Apartment);
        }

        [Fact]
        public async Task ParseQueryAsync_ShouldExtractRegionHouseAndSale()
        {
            // Given
            string query = "Samarqandda hovli sotiladi";

            // When
            PropertySearchParams result = await this.semanticSearchService.ParseQueryAsync(query);

            // Then
            result.Region.Should().Be("Samarqand");
            result.PropertyType.Should().Be(PropertyType.House);
            result.ListingType.Should().Be(ListingType.Sale);
        }

        [Fact]
        public async Task ParseQueryAsync_ShouldExtractAmenitiesAndRenovationLevel()
        {
            // Given
            string query = "Yunusoboddagi 2 xonali evroremont mebelli metroga yaqin";

            // When
            PropertySearchParams result = await this.semanticSearchService.ParseQueryAsync(query);

            // Then
            result.District.Should().Be("Yunusobod");
            result.Bedrooms.Should().Be(2);
            result.IsRenovated.Should().BeTrue();
            result.RenovationLevel.Should().Be(RenovationLevel.EuroLux);
            result.HasFurniture.Should().BeTrue();
            result.HasMetroNearby.Should().BeTrue();
        }

        [Fact]
        public async Task ParseQueryAsync_ShouldExtractShortTermRentAndPool()
        {
            // Given
            string query = "kunlik dacha basseynli";

            // When
            PropertySearchParams result = await this.semanticSearchService.ParseQueryAsync(query);

            // Then
            result.ListingType.Should().Be(ListingType.ShortTermRent);
            result.PropertyType.Should().Be(PropertyType.House);
            result.HasPool.Should().BeTrue();
        }

        [Fact]
        public async Task ParseQueryAsync_ShouldExtractWordBasedRoomsAndPriceRange()
        {
            // Given
            string query = "uch xonali kvartira 400 dan 700 gacha";

            // When
            PropertySearchParams result = await this.semanticSearchService.ParseQueryAsync(query);

            // Then
            result.Bedrooms.Should().Be(3);
            result.MinPrice.Should().Be(400m);
            result.MaxPrice.Should().Be(700m);
            result.PropertyType.Should().Be(PropertyType.Apartment);
        }
    }
}
