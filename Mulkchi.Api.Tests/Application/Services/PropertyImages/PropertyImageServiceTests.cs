using System;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.PropertyImages.Exceptions;
using Mulkchi.Api.Services.Foundations.PropertyImages;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.PropertyImages;

public class PropertyImageServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly IPropertyImageService propertyImageService;

    public PropertyImageServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();

        this.propertyImageService = new PropertyImageService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object);
    }

    private static PropertyImage CreateRandomPropertyImage()
    {
        return new Faker<PropertyImage>()
            .RuleFor(i => i.Id, f => Guid.NewGuid())
            .RuleFor(i => i.PropertyId, f => Guid.NewGuid())
            .RuleFor(i => i.Url, f => f.Internet.Url())
            .RuleFor(i => i.MediumUrl, f => f.Internet.Url())
            .RuleFor(i => i.ThumbnailUrl, f => f.Internet.Url())
            .RuleFor(i => i.Caption, f => f.Lorem.Sentence())
            .RuleFor(i => i.IsPrimary, f => f.Random.Bool())
            .RuleFor(i => i.CreatedDate, f => f.Date.PastOffset())
            .RuleFor(i => i.UpdatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddPropertyImageAsync_WithValidPropertyImage_ShouldAddImage()
    {
        // Arrange
        var propertyImage = CreateRandomPropertyImage();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertPropertyImageAsync(It.IsAny<PropertyImage>()))
            .ReturnsAsync(propertyImage);

        // Act
        var result = await this.propertyImageService.AddPropertyImageAsync(propertyImage);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(propertyImage.Id);
        
        this.storageBrokerMock.Verify(broker => broker.InsertPropertyImageAsync(It.IsAny<PropertyImage>()), Times.Once);
    }

    [Fact]
    public void RetrieveAllPropertyImages_ShouldReturnImages()
    {
        // Arrange
        var images = new List<PropertyImage>
        {
            CreateRandomPropertyImage(),
            CreateRandomPropertyImage()
        }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllPropertyImages())
            .Returns(images);

        // Act
        var result = this.propertyImageService.RetrieveAllPropertyImages();

        // Assert
        result.Should().NotBeNull();
        result.Count().Should().Be(2);
    }

    [Fact]
    public async Task RetrievePropertyImageByIdAsync_WhenImageExists_ShouldReturnImage()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var image = CreateRandomPropertyImage();
        image.Id = imageId;

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyImageByIdAsync(imageId))
            .ReturnsAsync(image);

        // Act
        var result = await this.propertyImageService.RetrievePropertyImageByIdAsync(imageId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(imageId);
    }

    [Fact]
    public async Task RetrievePropertyImageByIdAsync_WhenImageDoesNotExist_ShouldThrowNotFoundPropertyImageException()
    {
        // Arrange
        var imageId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyImageByIdAsync(imageId))
            .ReturnsAsync((PropertyImage)null);

        // Act
        Func<Task> action = async () => await this.propertyImageService.RetrievePropertyImageByIdAsync(imageId);

        // Assert
        var exception = await action.Should().ThrowAsync<PropertyImageDependencyValidationException>();
        exception.WithInnerException<NotFoundPropertyImageException>();
    }

    [Fact]
    public async Task RemovePropertyImageByIdAsync_WhenImageExists_ShouldRemoveImage()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var image = CreateRandomPropertyImage();
        image.Id = imageId;

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyImageByIdAsync(imageId))
            .ReturnsAsync(image);
        this.storageBrokerMock.Setup(broker => broker.DeletePropertyImageByIdAsync(imageId))
            .ReturnsAsync(image);

        // Act
        var result = await this.propertyImageService.RemovePropertyImageByIdAsync(imageId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(imageId);
        this.storageBrokerMock.Verify(broker => broker.DeletePropertyImageByIdAsync(imageId), Times.Once);
    }
}
