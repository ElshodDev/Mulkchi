#nullable disable


using System;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Xeptions;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Bookings.Exceptions;

namespace Mulkchi.Api.Services.Foundations.Bookings
{
    public partial class BookingService
    {
        private delegate ValueTask<Booking> ReturningBookingFunction();
        private delegate IQueryable<Booking> ReturningBookingsFunction();

        private async ValueTask<Booking> TryCatch(ReturningBookingFunction returningBookingFunction)
        {
            try
            {
                return await returningBookingFunction();
            }
            catch (NullBookingException ex) { throw new BookingValidationException(ex); }
            catch (InvalidBookingException ex) { throw new BookingValidationException(ex); }
            catch (NotFoundBookingException ex) { throw new BookingValidationException(ex); }
            catch (AlreadyExistsBookingException ex) { throw new BookingDependencyValidationException(ex); }
            catch (BookingDependencyValidationException ex) { throw new BookingDependencyValidationException(ex); }
            catch (BookingDependencyException) { throw; }
            catch (BookingServiceException) { throw; }
            catch (FailedBookingStorageException ex) { throw new BookingDependencyException(ex); }
            catch (FailedBookingServiceException ex) { throw new BookingServiceException(ex); }
            catch (DbException dbException)
            {
                var failedStorage = new FailedBookingStorageException(dbException);
                throw new BookingDependencyException(failedStorage);
            }
            catch (DbUpdateConcurrencyException dbUpdateConcurrencyException)
            {
                var failedStorage = new FailedBookingStorageException(dbUpdateConcurrencyException);
                throw new BookingDependencyException(failedStorage);
            }
            catch (DbUpdateException dbUpdateException)
            {
                var failedStorage = new FailedBookingStorageException(dbUpdateException);
                throw new BookingDependencyException(failedStorage);
            }
            catch (Exception ex)
            {
                var failedService = new FailedBookingServiceException(ex);
                throw new BookingServiceException(failedService);
            }
        }

        private IQueryable<Booking> TryCatch(ReturningBookingsFunction returningBookingsFunction)
        {
            try { return returningBookingsFunction(); }
            catch (Exception ex) { throw new BookingServiceException(ex); }
        }
    }
}