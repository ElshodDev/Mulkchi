using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Mulkchi.Api.Brokers.Notifications;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Bookings;

namespace Mulkchi.Api.Tests.Application.Services;

public class BookingServiceTests
{
    private readonly Mock<IStorageBroker> storageBroker = new();
    private readonly Mock<ICurrentUserService> currentUserService = new();
    private readonly Mock<IEmailBroker> emailBroker = new();
    private readonly Mock<ILogger<BookingService>> logger = new();

    [Fact]
    public async Task AddBookingAsync_WithAvailableProperty_ReturnsBookingResponse()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var propertyId = Guid.NewGuid();
        var hostId = Guid.NewGuid();
        var checkIn = new DateTimeOffset(2026, 06, 10, 12, 0, 0, TimeSpan.Zero);
        var checkOut = new DateTimeOffset(2026, 06, 14, 12, 0, 0, TimeSpan.Zero);

        var property = new Property
        {
            Id = propertyId,
            HostId = hostId,
            IsInstantBook = false
        };

        var dto = new BookingCreateDto
        {
            PropertyId = propertyId,
            CheckInDate = checkIn,
            CheckOutDate = checkOut,
            TotalPrice = 1_200_000
        };

        this.currentUserService.Setup(service => service.GetCurrentUserId())
            .Returns(currentUserId);
        this.currentUserService.Setup(service => service.IsInRole("Admin"))
            .Returns(false);
        this.storageBroker.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);
        this.storageBroker.Setup(broker => broker.SelectActiveBookingHolds(propertyId))
            .Returns(Array.Empty<BookingHold>().AsAsyncQueryable());
        this.storageBroker.Setup(broker => broker.SelectAllBookings())
            .Returns(Array.Empty<Booking>().AsAsyncQueryable());
        this.storageBroker.Setup(broker => broker.InsertBookingAsync(It.IsAny<Booking>()))
            .ReturnsAsync((Booking booking) => booking);
        this.emailBroker.Setup(broker => broker.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var bookingService = CreateBookingService();

        // Act
        BookingResponse result = await bookingService.AddBookingAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(propertyId, result.PropertyId);
        Assert.Equal(currentUserId, result.GuestId);
        Assert.Equal(BookingStatus.Pending, result.Status);
        this.storageBroker.Verify(broker => broker.InsertBookingAsync(It.IsAny<Booking>()), Times.Once);
    }

    [Fact]
    public async Task AddBookingAsync_WithOverlappingDates_ThrowsInvalidOperationException()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var propertyId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var checkIn = new DateTimeOffset(2026, 06, 10, 12, 0, 0, TimeSpan.Zero);
        var checkOut = new DateTimeOffset(2026, 06, 14, 12, 0, 0, TimeSpan.Zero);

        var property = new Property
        {
            Id = propertyId,
            HostId = Guid.NewGuid(),
            IsInstantBook = false
        };

        var dto = new BookingCreateDto
        {
            PropertyId = propertyId,
            CheckInDate = checkIn,
            CheckOutDate = checkOut,
            TotalPrice = 1_200_000
        };

        var overlappingBooking = new Booking
        {
            Id = Guid.NewGuid(),
            PropertyId = propertyId,
            GuestId = otherUserId,
            CheckInDate = checkIn.AddDays(-1),
            CheckOutDate = checkOut.AddDays(1),
            Status = BookingStatus.Confirmed,
            Property = property
        };

        this.currentUserService.Setup(service => service.GetCurrentUserId())
            .Returns(currentUserId);
        this.currentUserService.Setup(service => service.IsInRole("Admin"))
            .Returns(false);
        this.storageBroker.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);
        this.storageBroker.Setup(broker => broker.SelectActiveBookingHolds(propertyId))
            .Returns(Array.Empty<BookingHold>().AsAsyncQueryable());
        this.storageBroker.Setup(broker => broker.SelectAllBookings())
            .Returns(new[] { overlappingBooking }.AsAsyncQueryable());

        var bookingService = CreateBookingService();

        // Act
        ValueTask<BookingResponse> action = bookingService.AddBookingAsync(dto);

        // Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => action.AsTask());
    }

    [Fact]
    public async Task CancelBookingAsync_WithNonOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var hostId = Guid.NewGuid();

        var booking = new Booking
        {
            Id = bookingId,
            GuestId = ownerId,
            PropertyId = Guid.NewGuid(),
            Property = new Property
            {
                Id = Guid.NewGuid(),
                HostId = hostId
            },
            Status = BookingStatus.Pending
        };

        this.currentUserService.Setup(service => service.GetCurrentUserId())
            .Returns(currentUserId);
        this.currentUserService.Setup(service => service.IsInRole("Admin"))
            .Returns(false);
        this.storageBroker.Setup(broker => broker.SelectBookingByIdAsync(bookingId))
            .ReturnsAsync(booking);

        var bookingService = CreateBookingService();

        // Act
        ValueTask<BookingResponse> action = bookingService.CancelBookingAsync(bookingId);

        // Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => action.AsTask());
    }

    [Fact]
    public async Task ConfirmBookingAsync_WithNonHost_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var hostId = Guid.NewGuid();

        var booking = new Booking
        {
            Id = bookingId,
            GuestId = Guid.NewGuid(),
            PropertyId = Guid.NewGuid(),
            Property = new Property
            {
                Id = Guid.NewGuid(),
                HostId = hostId
            },
            Status = BookingStatus.Pending
        };

        this.currentUserService.Setup(service => service.GetCurrentUserId())
            .Returns(currentUserId);
        this.currentUserService.Setup(service => service.IsInRole("Admin"))
            .Returns(false);
        this.storageBroker.Setup(broker => broker.SelectBookingByIdAsync(bookingId))
            .ReturnsAsync(booking);

        var bookingService = CreateBookingService();

        // Act
        ValueTask<BookingResponse> action = bookingService.ConfirmBookingAsync(bookingId);

        // Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => action.AsTask());
    }

    [Fact]
    public async Task RetrieveBookingsAsync_WithCurrentUserId_ReturnsOnlyOwnBookings()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var ownBooking = new Booking
        {
            Id = bookingId,
            GuestId = currentUserId,
            PropertyId = Guid.NewGuid(),
            CheckInDate = new DateTimeOffset(2026, 06, 10, 12, 0, 0, TimeSpan.Zero),
            CheckOutDate = new DateTimeOffset(2026, 06, 12, 12, 0, 0, TimeSpan.Zero),
            Status = BookingStatus.Pending,
            CreatedDate = DateTimeOffset.UtcNow,
            UpdatedDate = DateTimeOffset.UtcNow,
            Property = new Property { HostId = Guid.NewGuid() }
        };

        var otherBooking = new Booking
        {
            Id = Guid.NewGuid(),
            GuestId = otherUserId,
            PropertyId = Guid.NewGuid(),
            CheckInDate = new DateTimeOffset(2026, 06, 15, 12, 0, 0, TimeSpan.Zero),
            CheckOutDate = new DateTimeOffset(2026, 06, 17, 12, 0, 0, TimeSpan.Zero),
            Status = BookingStatus.Pending,
            CreatedDate = DateTimeOffset.UtcNow,
            UpdatedDate = DateTimeOffset.UtcNow,
            Property = new Property { HostId = Guid.NewGuid() }
        };

        var queryParams = new BookingQueryParams
        {
            Page = 1,
            PageSize = 10,
            UserId = currentUserId,
            IsHostView = false
        };

        this.currentUserService.Setup(service => service.GetCurrentUserId())
            .Returns(currentUserId);
        this.currentUserService.Setup(service => service.IsInRole("Admin"))
            .Returns(false);
        this.storageBroker.Setup(broker => broker.SelectAllBookings())
            .Returns(new[] { ownBooking, otherBooking }.AsAsyncQueryable());

        var bookingService = CreateBookingService();

        // Act
        (IEnumerable<BookingResponse> items, int totalCount) = await bookingService.RetrieveBookingsAsync(queryParams);

        // Assert
        Assert.Equal(1, totalCount);
        Assert.Single(items);
        Assert.Equal(bookingId, items.First().Id);
    }

    private BookingService CreateBookingService() => new(
        this.storageBroker.Object,
        this.currentUserService.Object,
        this.emailBroker.Object,
        this.logger.Object);
}

internal static class AsyncQueryableExtensions
{
    public static IQueryable<T> AsAsyncQueryable<T>(this IEnumerable<T> items) =>
        new TestAsyncEnumerable<T>(items);
}

internal sealed class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable)
        : base(enumerable)
    {
    }

    public TestAsyncEnumerable(System.Linq.Expressions.Expression expression)
        : base(expression)
    {
    }

    public IAsyncEnumerator<T> GetAsyncEnumerator(System.Threading.CancellationToken cancellationToken = default) =>
        new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());

    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
}

internal sealed class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> enumerator;

    public TestAsyncEnumerator(IEnumerator<T> enumerator)
    {
        this.enumerator = enumerator;
    }

    public T Current => this.enumerator.Current;

    public ValueTask DisposeAsync()
    {
        this.enumerator.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync() => new(this.enumerator.MoveNext());
}

internal sealed class TestAsyncQueryProvider<T> : Microsoft.EntityFrameworkCore.Query.IAsyncQueryProvider
{
    private readonly IQueryProvider inner;

    public TestAsyncQueryProvider(IQueryProvider inner)
    {
        this.inner = inner;
    }

    public IQueryable CreateQuery(System.Linq.Expressions.Expression expression) =>
        new TestAsyncEnumerable<T>(expression);

    public IQueryable<TElement> CreateQuery<TElement>(System.Linq.Expressions.Expression expression) =>
        new TestAsyncEnumerable<TElement>(expression);

    public object Execute(System.Linq.Expressions.Expression expression) =>
        this.inner.Execute(expression)!;

    public TResult Execute<TResult>(System.Linq.Expressions.Expression expression) =>
        this.inner.Execute<TResult>(expression);

    public TResult ExecuteAsync<TResult>(System.Linq.Expressions.Expression expression, System.Threading.CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult).GetGenericArguments().First();
        var executeMethod = typeof(IQueryProvider)
            .GetMethods()
            .Single(method => method.Name == nameof(IQueryProvider.Execute) && method.IsGenericMethod)
            .MakeGenericMethod(resultType);

        object? executionResult = executeMethod.Invoke(this.inner, new object[] { expression });

        var fromResultMethod = typeof(Task)
            .GetMethods()
            .Single(method => method.Name == nameof(Task.FromResult) && method.IsGenericMethod)
            .MakeGenericMethod(resultType);

        return (TResult)fromResultMethod.Invoke(null, new[] { executionResult })!;
    }
}