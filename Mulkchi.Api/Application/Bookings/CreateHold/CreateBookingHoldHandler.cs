using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Application.Bookings.Common;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Application.Bookings.CreateHold;

public interface ICreateBookingHoldHandler
{
    ValueTask<CreateBookingHoldResult> HandleAsync(CreateBookingHoldCommand command);
}

public sealed class CreateBookingHoldHandler : ICreateBookingHoldHandler
{
    private static readonly TimeSpan HoldDuration = TimeSpan.FromMinutes(10);
    private readonly IValidator<CreateBookingHoldCommand> validator;
    private readonly IStorageBroker storageBroker;
    private readonly ICurrentUserService currentUserService;

    public CreateBookingHoldHandler(
        IValidator<CreateBookingHoldCommand> validator,
        IStorageBroker storageBroker,
        ICurrentUserService currentUserService)
    {
        this.validator = validator;
        this.storageBroker = storageBroker;
        this.currentUserService = currentUserService;
    }

    public async ValueTask<CreateBookingHoldResult> HandleAsync(CreateBookingHoldCommand command)
    {
        await this.validator.ValidateAndThrowAsync(command);

        Guid? currentUserId = this.currentUserService.GetCurrentUserId();
        if (!currentUserId.HasValue)
            throw new UnauthorizedAccessException("Current user is missing.");

        await this.storageBroker.DeleteExpiredBookingHoldsAsync();

        bool holdConflict = await this.storageBroker
            .SelectActiveBookingHolds(command.PropertyId)
            .AnyAsync(hold =>
                hold.UserId != currentUserId.Value &&
                BookingOverlapPolicy.IsOverlapping(
                    hold.CheckInDate,
                    hold.CheckOutDate,
                    command.CheckInDate,
                    command.CheckOutDate));

        if (holdConflict)
            throw new InvalidOperationException("Selected dates are currently held by another user.");

        bool bookingConflict = await this.storageBroker
            .SelectAllBookings()
            .AnyAsync(booking => BookingOverlapPolicy.ConflictsWithBooking(
                booking,
                command.PropertyId,
                command.CheckInDate,
                command.CheckOutDate));

        if (bookingConflict)
            throw new InvalidOperationException("Selected dates are already booked.");

        DateTimeOffset now = DateTimeOffset.UtcNow;
        BookingHold hold = await this.storageBroker.InsertBookingHoldAsync(new BookingHold
        {
            Id = Guid.NewGuid(),
            PropertyId = command.PropertyId,
            UserId = currentUserId.Value,
            CheckInDate = command.CheckInDate,
            CheckOutDate = command.CheckOutDate,
            ExpiresAt = now.Add(HoldDuration),
            CreatedDate = now
        });

        return new CreateBookingHoldResult
        {
            HoldId = hold.Id,
            PropertyId = hold.PropertyId,
            CheckInDate = hold.CheckInDate,
            CheckOutDate = hold.CheckOutDate,
            ExpiresAt = hold.ExpiresAt
        };
    }
}
