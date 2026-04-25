using FluentAssertions;
using MockQueryable.Moq;
using Moq;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Tests.Unit.Tests.Foundations.Bookings;

public partial class BookingServiceTests
{
    [Fact]
    public async Task ShouldAddBookingAsync()
    {
        // given
        BookingCreateDto randomBooking = CreateRandomBookingCreateDto();
        BookingCreateDto inputBooking = randomBooking;
        Guid currentUserId = Guid.NewGuid();
        Property property = new Property { Id = inputBooking.PropertyId };
        Booking addedBooking = new Booking
        {
            Id = Guid.NewGuid(),
            PropertyId = inputBooking.PropertyId,
            GuestId = currentUserId,
            CheckInDate = inputBooking.CheckInDate,
            CheckOutDate = inputBooking.CheckOutDate,
            TotalPrice = inputBooking.TotalPrice,
            Status = BookingStatus.Pending,
            CreatedDate = DateTimeOffset.UtcNow,
            UpdatedDate = DateTimeOffset.UtcNow
        };

        BookingResponse expectedBooking = new BookingResponse
        {
            Id = addedBooking.Id,
            PropertyId = addedBooking.PropertyId,
            GuestId = addedBooking.GuestId,
            CheckInDate = addedBooking.CheckInDate,
            CheckOutDate = addedBooking.CheckOutDate,
            TotalPrice = addedBooking.TotalPrice,
            Status = addedBooking.Status,
            CreatedDate = addedBooking.CreatedDate,
            UpdatedDate = addedBooking.UpdatedDate
        };

        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(currentUserId);

        this.storageBrokerMock.Setup(broker =>
            broker.SelectPropertyByIdAsync(inputBooking.PropertyId))
                .ReturnsAsync(property);

        this.storageBrokerMock.Setup(broker =>
            broker.InsertBookingAsync(It.IsAny<Booking>()))
                .ReturnsAsync(addedBooking);

        this.emailBrokerMock.Setup(broker =>
            broker.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

        // Mock async queryables for conflict checking
        var emptyBookingHolds = new List<BookingHold>().AsQueryable().BuildMock();
        var emptyBookings = new List<Booking>().AsQueryable().BuildMock();

        this.storageBrokerMock.Setup(broker =>
            broker.SelectActiveBookingHolds(It.IsAny<Guid>()))
                .Returns(emptyBookingHolds);

        this.storageBrokerMock.Setup(broker =>
            broker.SelectAllBookings())
                .Returns(emptyBookings);

        // when
        BookingResponse actualBooking = await this.bookingService.AddBookingAsync(inputBooking);

        // then
        actualBooking.Should().BeEquivalentTo(expectedBooking);

        this.storageBrokerMock.Verify(broker =>
            broker.SelectPropertyByIdAsync(inputBooking.PropertyId),
            Times.Once);

        this.storageBrokerMock.Verify(broker =>
            broker.InsertBookingAsync(It.IsAny<Booking>()),
            Times.Once);

        this.emailBrokerMock.Verify(broker =>
            broker.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);

        this.storageBrokerMock.VerifyNoOtherCalls();
        this.emailBrokerMock.VerifyNoOtherCalls();
    }
}


