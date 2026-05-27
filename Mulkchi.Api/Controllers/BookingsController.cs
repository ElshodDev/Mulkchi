using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FluentValidation;
using Mulkchi.Api.Application.Bookings.ConfirmPayment;
using Mulkchi.Api.Application.Bookings.Contracts;
using Mulkchi.Api.Application.Bookings.CreateHold;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Services.Foundations.Bookings;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService bookingService;
        private readonly ICreateBookingHoldHandler createBookingHoldHandler;
        private readonly IConfirmBookingPaymentHandler confirmBookingPaymentHandler;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(
            IBookingService bookingService,
            ICreateBookingHoldHandler createBookingHoldHandler,
            IConfirmBookingPaymentHandler confirmBookingPaymentHandler,
            ILogger<BookingsController> logger)
        {
            this.bookingService = bookingService;
            this.createBookingHoldHandler = createBookingHoldHandler;
            this.confirmBookingPaymentHandler = confirmBookingPaymentHandler;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<PagedResult<BookingResponse>>> GetAllBookings([FromQuery] BookingQueryParams queryParams)
        {
            try
            {
                var (items, total) = await this.bookingService.RetrieveBookingsAsync(queryParams);

                var result = new PagedResult<BookingResponse>
                {
                    Items = items,
                    TotalCount = total,
                    Page = queryParams.Page,
                    PageSize = queryParams.PageSize
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(GetMyBookings));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult<PagedResult<BookingResponse>>> GetMyBookings([FromQuery] BookingQueryParams queryParams)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                    return Unauthorized();

                queryParams.UserId = currentUserId;
                queryParams.IsHostView = false;

                var (items, total) = await this.bookingService.RetrieveBookingsAsync(queryParams);

                var result = new PagedResult<BookingResponse>
                {
                    Items = items,
                    TotalCount = total,
                    Page = queryParams.Page,
                    PageSize = queryParams.PageSize
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(GetMyBookings));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpGet("host")]
        [Authorize(Roles = "Host,Admin,SuperAdmin")]
        public async Task<ActionResult<PagedResult<BookingResponse>>> GetHostBookings([FromQuery] BookingQueryParams queryParams)
        {
            try
            {
                var userRole = User.FindFirstValue(ClaimTypes.Role);
                if (userRole == "Guest")
                {
                    return Forbid();
                }

                queryParams.IsHostView = true;

                var (items, total) = await this.bookingService.RetrieveBookingsAsync(queryParams);

                var result = new PagedResult<BookingResponse>
                {
                    Items = items,
                    TotalCount = total,
                    Page = queryParams.Page,
                    PageSize = queryParams.PageSize
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(GetHostBookings));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async ValueTask<ActionResult<BookingResponse>> GetBookingByIdAsync(Guid id)
        {
            try
            {
                var booking = await this.bookingService.RetrieveBookingByIdAsync(id);
                return Ok(booking);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(GetBookingByIdAsync));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpPost]
        [Authorize]
        public async ValueTask<ActionResult<BookingResponse>> PostBookingAsync([FromBody] BookingCreateDto dto)
        {
            try
            {
                var createdBooking = await this.bookingService.AddBookingAsync(dto);
                return CreatedAtAction(nameof(GetBookingByIdAsync), new { id = createdBooking.Id }, createdBooking);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(PostBookingAsync));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpPost("{id}/confirm")]
        [Authorize(Roles = "Host,Admin,SuperAdmin")]
        public async ValueTask<ActionResult<BookingResponse>> ConfirmBookingAsync(Guid id)
        {
            try
            {
                var confirmedBooking = await this.bookingService.ConfirmBookingAsync(id);
                return Ok(confirmedBooking);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(ConfirmBookingAsync));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpPost("{id}/cancel")]
        [Authorize]
        public async ValueTask<ActionResult<BookingResponse>> CancelBookingAsync(Guid id)
        {
            try
            {
                var cancelledBooking = await this.bookingService.CancelBookingAsync(id);
                return Ok(cancelledBooking);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(CancelBookingAsync));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpPut]
        [Authorize]
        public async ValueTask<ActionResult<Booking>> PutBookingAsync([FromBody] Booking booking)
        {
            try
            {
                Booking modifiedBooking = await this.bookingService.ModifyBookingAsync(booking);
                return Ok(modifiedBooking);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(PutBookingAsync));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async ValueTask<ActionResult<Booking>> DeleteBookingAsync(Guid id)
        {
            try
            {
                Booking deletedBooking = await this.bookingService.RemoveBookingAsync(id);
                return Ok(deletedBooking);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(DeleteBookingAsync));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpGet("availability/{propertyId}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetPropertyAvailability(Guid propertyId, [FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                if (year <= 0) year = DateTimeOffset.UtcNow.Year;
                if (month <= 0 || month > 12) month = DateTimeOffset.UtcNow.Month;

                var blocked = await this.bookingService.RetrieveBlockedDatesAsync(propertyId, year, month);
                var blockedStrings = blocked.Select(d => d.ToString("yyyy-MM-dd")).ToList();

                return Ok(new { propertyId, year, month, blockedDates = blockedStrings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(GetPropertyAvailability));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpPost("hold")]
        [Authorize]
        public async ValueTask<ActionResult> CreateBookingHold([FromBody] CreateBookingHoldHttpRequest request)
        {
            try
            {
                var result = await this.createBookingHoldHandler.HandleAsync(
                    new CreateBookingHoldCommand(
                        request.PropertyId,
                        request.CheckInDate,
                        request.CheckOutDate));

                return Ok(new
                {
                    holdId = result.HoldId,
                    propertyId = result.PropertyId,
                    checkInDate = result.CheckInDate,
                    checkOutDate = result.CheckOutDate,
                    expiresAt = result.ExpiresAt,
                    message = "Sanalar 10 daqiqa davomida siz uchun band qilindi."
                });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(ConfirmBookingPayment));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpPost("confirm-payment")]
        [Authorize]
        public async ValueTask<ActionResult> ConfirmBookingPayment([FromBody] ConfirmBookingPaymentHttpRequest request)
        {
            try
            {
                string? idempotencyKey = Request.Headers["X-Idempotency-Key"].FirstOrDefault();
                var result = await this.confirmBookingPaymentHandler.HandleAsync(
                    new ConfirmBookingPaymentCommand(
                        request.HoldId,
                        request.Amount,
                        request.Method,
                        idempotencyKey));

                return Ok(result);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(ConfirmBookingPayment));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpDelete("hold/{holdId}")]
        [Authorize]
        public async ValueTask<ActionResult> ReleaseBookingHold(Guid holdId)
        {
            try
            {
                await this.bookingService.ReleaseBookingHoldAsync(holdId);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in {Controller}.{Method}", nameof(BookingsController), nameof(ReleaseBookingHold));
                return StatusCode(500, new { message = "Internal server error." });
            }
        }
    }
}

