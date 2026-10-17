using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Services.Foundations.AI;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.AI
{
    public class PropertyFraudDetectionServiceTests
    {
        private readonly Mock<IStorageBroker> storageBrokerMock;
        private readonly Mock<IPriceRecommendationService> priceRecommendationServiceMock;
        private readonly Mock<ILoggingBroker> loggingBrokerMock;
        private readonly IPropertyFraudDetectionService fraudDetectionService;

        public PropertyFraudDetectionServiceTests()
        {
            this.storageBrokerMock = new Mock<IStorageBroker>();
            this.priceRecommendationServiceMock = new Mock<IPriceRecommendationService>();
            this.loggingBrokerMock = new Mock<ILoggingBroker>();

            this.fraudDetectionService = new PropertyFraudDetectionService(
                this.storageBrokerMock.Object,
                this.priceRecommendationServiceMock.Object,
                this.loggingBrokerMock.Object);
        }

        [Fact]
        public async Task AssessPropertyRiskAsync_ShouldFlagHighRisk_WhenPriceIsSuspiciouslyLowAndAdvancePaymentMentioned()
        {
            // Given
            var hostId = Guid.NewGuid();
            var host = new User
            {
                Id = hostId,
                IsVerified = false,
                EmailConfirmed = false
            };

            var property = new Property
            {
                Id = Guid.NewGuid(),
                HostId = hostId,
                Title = "Shoshilinch arzon kvartira",
                Description = "Juda shoshilinch arzon beraman, faqat oldindan to'lov kartaga o'tkazing.",
                Area = 100,
                NumberOfBedrooms = 3,
                ListingType = ListingType.Rent,
                MonthlyRent = 150m, // Extremely cheap for 100 sqm 3 rooms
                Region = UzbekistanRegion.ToshkentShahar,
                District = "Mirobod"
            };

            this.storageBrokerMock.Setup(b => b.SelectUserByIdAsync(hostId))
                .ReturnsAsync(host);

            this.storageBrokerMock.Setup(b => b.SelectAllPropertyImages())
                .Returns(new List<PropertyImage>().AsQueryable());

            this.priceRecommendationServiceMock.Setup(p => p.PredictPriceAsync(It.IsAny<PriceRecommendationRequest>()))
                .ReturnsAsync(new PriceRecommendationResponse
                {
                    PredictedPrice = 900m // Market is $900, property is $150 (< 20%)
                });

            // When
            FraudAssessmentResult result = await this.fraudDetectionService.AssessPropertyRiskAsync(property);

            // Then
            result.IsSuspicious.Should().BeTrue();
            result.RiskLevel.Should().BeOneOf("High", "Critical");
            result.RiskScore.Should().BeGreaterThanOrEqualTo(50);
            result.RiskFactors.Should().Contain(f => f.Contains("avans") || f.Contains("arzon"));
        }

        [Fact]
        public async Task AssessPropertyRiskAsync_ShouldIndicateLowRisk_WhenHostIsVerifiedAndPriceIsNormal()
        {
            // Given
            var hostId = Guid.NewGuid();
            var host = new User
            {
                Id = hostId,
                IsVerified = true,
                EmailConfirmed = true,
                Phone = "+998901234567"
            };

            var property = new Property
            {
                Id = Guid.NewGuid(),
                HostId = hostId,
                Title = "Yunusobod 4-mavzeda shinam 2 xonali kvartira",
                Description = "Barcha qulayliklari bor, metroga yaqin, uzoq muddatli oilaga ijaraga beriladi.",
                Area = 60,
                NumberOfBedrooms = 2,
                ListingType = ListingType.Rent,
                MonthlyRent = 450m,
                Region = UzbekistanRegion.ToshkentShahar,
                District = "Yunusobod"
            };

            var images = new List<PropertyImage>
            {
                new PropertyImage { Id = Guid.NewGuid(), PropertyId = property.Id, Url = "img1.jpg" },
                new PropertyImage { Id = Guid.NewGuid(), PropertyId = property.Id, Url = "img2.jpg" }
            };

            this.storageBrokerMock.Setup(b => b.SelectUserByIdAsync(hostId))
                .ReturnsAsync(host);

            this.storageBrokerMock.Setup(b => b.SelectAllPropertyImages())
                .Returns(images.AsQueryable());

            this.priceRecommendationServiceMock.Setup(p => p.PredictPriceAsync(It.IsAny<PriceRecommendationRequest>()))
                .ReturnsAsync(new PriceRecommendationResponse
                {
                    PredictedPrice = 480m
                });

            // When
            FraudAssessmentResult result = await this.fraudDetectionService.AssessPropertyRiskAsync(property);

            // Then
            result.IsSuspicious.Should().BeFalse();
            result.RiskLevel.Should().Be("Low");
            result.RiskScore.Should().BeLessThan(25);
        }
    }
}
