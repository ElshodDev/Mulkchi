using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Models.Foundations.Payments.Exceptions;
using Mulkchi.Api.Services.Foundations.Payments;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        this.paymentService = paymentService;
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<Payment>> PostPaymentAsync(Payment payment)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            // Idempotency: if the client supplies X-Idempotency-Key and we already
            // processed a payment with that key, return the original result instead of
            // charging twice (safe to replay on network retries).
            var idempotencyKey = Request.Headers["X-Idempotency-Key"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                Payment? existing = await this.paymentService.RetrievePaymentByIdempotencyKeyAsync(idempotencyKey);
                if (existing is not null)
                    return Ok(existing);

                payment.IdempotencyKey = idempotencyKey;
            }

            payment.PayerId = currentUserId;
            Payment addedPayment = await this.paymentService.AddPaymentAsync(payment);
            return Created("payment", addedPayment);
        }
        catch (PaymentValidationException paymentValidationException)
        {
            return BadRequest(new { message = paymentValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
        {
            return BadRequest(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResult<Payment>>> GetAllPayments([FromQuery] PaginationParams pagination)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var isAdmin = User.IsInRole("Admin");
            IQueryable<Payment> query = isAdmin
                ? this.paymentService.RetrieveAllPayments()
                : this.paymentService.RetrieveAllPayments().Where(p => p.PayerId == userId || p.ReceiverId == userId);

            int totalCount = await query.CountAsync();

            var items = await query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            var result = new PagedResult<Payment>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<Payment>> GetPaymentByIdAsync(Guid id)
    {
        try
        {
            Payment payment = await this.paymentService.RetrievePaymentByIdAsync(id);
            return Ok(payment);
        }
        catch (PaymentValidationException paymentValidationException)
        {
            return BadRequest(new { message = paymentValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
            when (paymentDependencyValidationException.InnerException is NotFoundPaymentException)
        {
            return NotFound(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
        {
            return BadRequest(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<PagedResult<Payment>>> GetMyPayments([FromQuery] PaginationParams pagination)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            IQueryable<Payment> query = this.paymentService
                .RetrieveAllPayments()
                .Where(payment => payment.PayerId == currentUserId || payment.ReceiverId == currentUserId);

            int totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(payment => payment.CreatedDate)
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            var result = new PagedResult<Payment>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("booking/{bookingId}")]
    [Authorize]
    public ActionResult<Payment> GetPaymentByBookingId(Guid bookingId)
    {
        try
        {
            // Payment model currently does not have explicit BookingId.
            // For compatibility, try to resolve by related IDs and fallback to direct payment Id match.
            Payment? payment = this.paymentService
                .RetrieveAllPayments()
                .FirstOrDefault(p => p.Id == bookingId || p.ContractId == bookingId || p.HomeRequestId == bookingId);

            if (payment is null)
                return NotFound(new { message = "Payment not found for booking." });

            return Ok(payment);
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("summary")]
    [Authorize]
    public ActionResult<object> GetPaymentSummary()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            var payments = this.paymentService
                .RetrieveAllPayments()
                .Where(payment => payment.PayerId == currentUserId || payment.ReceiverId == currentUserId)
                .ToList();

            var successful = payments.Where(payment => payment.Status == PaymentStatus.Completed).ToList();
            var pending = payments.Where(payment => payment.Status == PaymentStatus.Pending || payment.Status == PaymentStatus.Processing).ToList();

            return Ok(new
            {
                totalPayments = payments.Count,
                totalAmount = successful.Sum(payment => payment.Amount),
                totalFees = successful.Sum(payment => payment.PlatformFee),
                pendingAmount = pending.Sum(payment => payment.Amount),
                completedPayments = successful.Count,
                cancelledPayments = payments.Count(payment => payment.Status == PaymentStatus.Cancelled),
                failedPayments = payments.Count(payment => payment.Status == PaymentStatus.Failed)
            });
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<Payment>> PutPaymentAsync(Payment payment)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            if (!isAdmin)
            {
                Payment existingPayment = await this.paymentService.RetrievePaymentByIdAsync(payment.Id);
                if (existingPayment is null)
                    return NotFound(new { message = "Payment not found." });

                if (existingPayment.PayerId != currentUserId)
                    return Forbid();
            }

            Payment modifiedPayment = await this.paymentService.ModifyPaymentAsync(payment);
            return Ok(modifiedPayment);
        }
        catch (PaymentValidationException paymentValidationException)
        {
            return BadRequest(new { message = paymentValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
            when (paymentDependencyValidationException.InnerException is NotFoundPaymentException)
        {
            return NotFound(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
        {
            return BadRequest(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<Payment>> DeletePaymentByIdAsync(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            if (!isAdmin)
            {
                Payment existingPayment = await this.paymentService.RetrievePaymentByIdAsync(id);
                if (existingPayment is null)
                    return NotFound(new { message = "Payment not found." });

                if (existingPayment.PayerId != currentUserId && existingPayment.ReceiverId != currentUserId)
                    return Forbid();
            }

            Payment deletedPayment = await this.paymentService.RemovePaymentByIdAsync(id);
            return Ok(deletedPayment);
        }
        catch (PaymentValidationException paymentValidationException)
        {
            return BadRequest(new { message = paymentValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
            when (paymentDependencyValidationException.InnerException is NotFoundPaymentException)
        {
            return NotFound(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
        {
            return BadRequest(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPut("{id}/cancel")]
    [Authorize]
    public async ValueTask<ActionResult<Payment>> CancelPaymentAsync(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            Payment payment = await this.paymentService.RetrievePaymentByIdAsync(id);

            bool isAdmin = User.IsInRole("Admin");
            if (!isAdmin && payment.PayerId != currentUserId && payment.ReceiverId != currentUserId)
                return Forbid();

            payment.Status = PaymentStatus.Cancelled;
            Payment updatedPayment = await this.paymentService.ModifyPaymentAsync(payment);

            return Ok(updatedPayment);
        }
        catch (PaymentValidationException paymentValidationException)
        {
            return BadRequest(new { message = paymentValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
            when (paymentDependencyValidationException.InnerException is NotFoundPaymentException)
        {
            return NotFound(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyValidationException paymentDependencyValidationException)
        {
            return BadRequest(new { message = paymentDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (PaymentDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (PaymentServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
