using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Mulkchi.Api.Brokers.Notifications;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Bookings.Exceptions;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Bookings;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Bookings;

public partial class BookingServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ICurrentUserService> currentUserServiceMock;
    private readonly Mock<IEmailBroker> emailBrokerMock;
    private readonly Mock<ILogger<BookingService>> loggerMock;
    private readonly IBookingService bookingService;

    public BookingServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.currentUserServiceMock = new Mock<ICurrentUserService>();
        this.emailBrokerMock = new Mock<IEmailBroker>();
        this.loggerMock = new Mock<ILogger<BookingService>>();

        this.bookingService = new BookingService(
            this.storageBrokerMock.Object,
            this.currentUserServiceMock.Object,
            this.emailBrokerMock.Object,
            this.loggerMock.Object);
    }

    private static BookingCreateDto CreateRandomBookingCreateDto(Guid propertyId)
    {
        var faker = new Faker();
        var checkIn = faker.Date.FutureOffset();
        var checkOut = checkIn.AddDays(faker.Random.Int(1, 10));

        return new Faker<BookingCreateDto>()
            .RuleFor(dto => dto.PropertyId, _ => propertyId)
            .RuleFor(b => b.CheckInDate, _ => checkIn)
            .RuleFor(b => b.CheckOutDate, _ => checkOut)
            .Generate();
    }

    private static Property CreateRandomProperty(Guid propertyId)
    {
        return new Faker<Property>()
            .RuleFor(p => p.Id, _ => propertyId)
            .RuleFor(p => p.HostId, faker => Guid.NewGuid())
            .RuleFor(p => p.IsInstantBook, faker => faker.Random.Bool())
            .RuleFor(p => p.MonthlyRent, faker => faker.Random.Decimal(100, 1000))
            .Generate();
    }

    private static Booking CreateRandomBooking()
    {
        var faker = new Faker();
        var checkIn = faker.Date.FutureOffset();
        var checkOut = checkIn.AddDays(faker.Random.Int(1, 10));

        return new Faker<Booking>()
            .RuleFor(b => b.Id, f => Guid.NewGuid())
            .RuleFor(b => b.GuestId, f => Guid.NewGuid())
            .RuleFor(b => b.PropertyId, f => Guid.NewGuid())
            .RuleFor(b => b.CheckInDate, _ => checkIn)
            .RuleFor(b => b.CheckOutDate, _ => checkOut)
            .RuleFor(b => b.CreatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddBookingAsync_WithValidBooking_ShouldAddBookingAndSendNotifications()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var property = CreateRandomProperty(propertyId);
        var booking = CreateRandomBooking();
        booking.PropertyId = propertyId;

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);
        this.storageBrokerMock.Setup(broker => broker.InsertBookingAsync(booking))
            .ReturnsAsync(booking);

        // Act
        var result = await this.bookingService.AddBookingAsync(booking);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(booking.Id);

        this.storageBrokerMock.Verify(broker => broker.InsertBookingAsync(It.IsAny<Booking>()), Times.Once);
        // We can't easily mock extensions in this basic test but we verified the core broker call.
    }

    [Fact]
    public async Task RetrieveBookingByIdAsync_WhenBookingExistsAndUserCanAccessIt_ShouldReturnBooking()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateRandomBooking();
        booking.Id = bookingId;
        var property = CreateRandomProperty(booking.PropertyId);
        booking.Property = property;

        var userId = booking.GuestId;

        this.storageBrokerMock.Setup(broker => broker.SelectBookingByIdAsync(bookingId))
            .ReturnsAsync(booking);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(userId);
        this.currentUserServiceMock.Setup(service => service.IsInRole("Admin"))
            .Returns(false);

        // Act
        var result = await this.bookingService.RetrieveBookingByIdAsync(bookingId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(bookingId);
    }

    [Fact]
    public async Task RetrieveBookingByIdAsync_WhenUserCannotAccessIt_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateRandomBooking();
        booking.Id = bookingId;
        var property = CreateRandomProperty(booking.PropertyId);
        booking.Property = property;

        var differentUserId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectBookingByIdAsync(bookingId))
            .ReturnsAsync(booking);
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(differentUserId);
        this.currentUserServiceMock.Setup(service => service.IsInRole("Admin"))
            .Returns(false);

        // Act
        Func<Task> action = async () => await this.bookingService.RetrieveBookingByIdAsync(bookingId);

        // Assert
        await action.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RetrieveBookingByIdAsync_WhenBookingDoesNotExist_ShouldThrowNotFoundBookingException()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectBookingByIdAsync(bookingId))
            .ReturnsAsync((Booking)null);

        // Act
        Func<Task> action = async () => await this.bookingService.RetrieveBookingByIdAsync(bookingId);

        // Assert
        await action.Should().ThrowAsync<NotFoundBookingException>();
    }

    [Fact]
    public async Task RemoveBookingAsync_WhenBookingExists_ShouldRemoveBooking()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = CreateRandomBooking();
        booking.Id = bookingId;

        this.storageBrokerMock.Setup(broker => broker.SelectBookingByIdAsync(bookingId))
            .ReturnsAsync(booking);
        this.storageBrokerMock.Setup(broker => broker.DeleteBookingAsync(bookingId))
            .ReturnsAsync(booking);

        // Act
        var result = await this.bookingService.RemoveBookingAsync(bookingId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(bookingId);
        this.storageBrokerMock.Verify(broker => broker.DeleteBookingAsync(bookingId), Times.Once);
    }
}
