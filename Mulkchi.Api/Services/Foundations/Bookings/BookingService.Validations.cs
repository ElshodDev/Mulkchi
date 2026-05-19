#nullable disable

using System;
using Mulkchi.Api.Models.Foundations.Bookings;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Bookings
{
    public partial class BookingService
    {
        private void ValidateBookingOnAdd(Booking booking)
        {
            ValidateBookingNotNull(booking);
            ValidateBookingIds(booking);
            ValidateBookingDates(booking);
        }

        private void ValidateBookingOnModify(Booking booking)
        {
            ValidateBookingNotNull(booking);
            ValidateBookingId(booking.Id);
            ValidateBookingIds(booking);
            ValidateBookingDates(booking);
        }

        private void ValidateBookingNotNull(Booking booking)
        {
            if (booking is null)
                throw new Models.Foundations.Bookings.Exceptions.NullBookingException();
        }

        private void ValidateBookingId(Guid bookingId)
        {
            if (bookingId == default)
                throw new Models.Foundations.Bookings.Exceptions.InvalidBookingException("Id is required.");
        }

        private void ValidateBookingIds(Booking booking)
        {
            if (booking.PropertyId == default)
                throw new Models.Foundations.Bookings.Exceptions.InvalidBookingException("PropertyId is required.");
            if (booking.GuestId == default)
                throw new Models.Foundations.Bookings.Exceptions.InvalidBookingException("GuestId is required.");
        }

        private void ValidateBookingDates(Booking booking)
        {
            if (booking.CheckInDate == default)
                throw new Models.Foundations.Bookings.Exceptions.InvalidBookingException("CheckInDate is required.");
            if (booking.CheckOutDate == default)
                throw new Models.Foundations.Bookings.Exceptions.InvalidBookingException("CheckOutDate is required.");
            if (booking.CheckOutDate <= booking.CheckInDate)
                throw new Models.Foundations.Bookings.Exceptions.InvalidBookingException("CheckOutDate must be after CheckInDate.");
        }

        private void ValidateStorageBooking(Booking maybeBooking, Guid bookingId)
        {
            if (maybeBooking is null)
                throw new Models.Foundations.Bookings.Exceptions.NotFoundBookingException(bookingId);
        }
    }
}