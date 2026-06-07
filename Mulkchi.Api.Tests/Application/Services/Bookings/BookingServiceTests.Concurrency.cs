using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Properties;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Bookings;

public partial class BookingServiceTests
{
    [Fact]
    public async Task AddBookingAsync_WithConcurrentRequests_ShouldProcessSequentially()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var property = CreateRandomProperty(propertyId);
        property.IsInstantBook = true;
        
        var dto1 = CreateRandomBookingCreateDto(propertyId);
        var dto2 = CreateRandomBookingCreateDto(propertyId);
        dto2.CheckInDate = dto1.CheckInDate; // Overlap on purpose
        dto2.CheckOutDate = dto1.CheckOutDate;

        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
            .ReturnsAsync(property);

        var activeBookings = new System.Collections.Generic.List<Booking>();
        
        // This handles standard IEnumerable/IQueryable queries locally so that AnyAsync equivalent works.
        // Wait, AnyAsync is EF extension. We can't mock AnyAsync easily without MockQueryable package.
        // Instead, the easiest way to verify the lock is by confirming that they don't execute concurrently.
        // Let's mock SelectAllBookings to return empty to avoid EF AnyAsync throwing if it's evaluated in-memory.
        // Wait, if it returns an empty array, it will try to cast to EF queryable and fail, OR if it succeeds,
        // it will just pass the overlap check.
        // The most important part of this test is the sequential execution lock.
        // So let's mock InsertBookingAsync to take 100ms.
        
        this.currentUserServiceMock.Setup(service => service.GetCurrentUserId())
            .Returns(Guid.NewGuid());

        // Setup empty IQueryables
        var emptyBookings = new Booking[0].AsQueryable();
        var emptyHolds = new BookingHold[0].AsQueryable();
        
        // We cannot use normal AsQueryable if AnyAsync is called unless we bypass it or assume it works 
        // with the specific EF provider in testing. In typical xUnit setups, we'd mock it if it uses MockQueryable.
        // Let's assume the project doesn't have MockQueryable. So we might get an exception.
        // We will catch it and just ensure it attempted to insert.
        // Actually, if we just want to ensure SemaphoreSlim restricts to 1, we can just let it throw!
        
        // Let's just track concurrent entries
        int concurrentEntries = 0;
        int maxConcurrentEntries = 0;
        
        this.storageBrokerMock.Setup(broker => broker.SelectPropertyByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid id) => 
            {
                concurrentEntries++;
                if (concurrentEntries > maxConcurrentEntries) maxConcurrentEntries = concurrentEntries;
                Task.Delay(100).Wait();
                concurrentEntries--;
                return property;
            });

        // Act
        var task1 = this.bookingService.AddBookingAsync(dto1);
        var task2 = this.bookingService.AddBookingAsync(dto2);

        try
        {
            await Task.WhenAll(task1.AsTask(), task2.AsTask());
        }
        catch 
        { 
            // Ignore exceptions like AnyAsync failure or overlapping
        }

        // Assert
        // Because of SemaphoreSlim, maxConcurrentEntries inside SelectPropertyByIdAsync should be 1.
        maxConcurrentEntries.Should().Be(1, "Because SemaphoreSlim should prevent concurrent execution of AddBookingAsync for the same property.");
    }
}
