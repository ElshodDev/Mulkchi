using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.RentalContracts;
using Mulkchi.Api.Models.Foundations.RentalContracts.Exceptions;
using Mulkchi.Api.Services.Foundations.Bookings;
using Mulkchi.Api.Services.Foundations.RentalContracts;
using System.Security.Claims;
using System.Text;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/rental-contracts")]
public class RentalContractsController : ControllerBase
{
    private readonly IRentalContractService rentalContractService;
    private readonly IBookingService bookingService;

    public sealed class UpdateStatusRequest
    {
        public ContractStatus Status { get; set; }
    }

    public sealed class TerminateContractRequest
    {
        public string? Reason { get; set; }
    }

    public sealed class CreateFromBookingRequest
    {
        public decimal MonthlyRent { get; set; }
        public decimal SecurityDeposit { get; set; }
        public DateTimeOffset StartDate { get; set; }
        public DateTimeOffset EndDate { get; set; }
        public string? Terms { get; set; }
    }

    public RentalContractsController(IRentalContractService rentalContractService, IBookingService bookingService)
    {
        this.rentalContractService = rentalContractService;
        this.bookingService = bookingService;
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> PostRentalContractAsync(RentalContract rentalContract)
    {
        try
        {
            RentalContract addedRentalContract = await this.rentalContractService.AddRentalContractAsync(rentalContract);
            return Created("rentalContract", addedRentalContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
        {
            return BadRequest(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [Authorize]
    public ActionResult<PagedResult<RentalContract>> GetAllRentalContracts([FromQuery] PaginationParams pagination)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var isAdmin = User.IsInRole("Admin");
            IQueryable<RentalContract> query = isAdmin
                ? this.rentalContractService.RetrieveAllRentalContracts()
                : this.rentalContractService.RetrieveAllRentalContracts().Where(r => r.TenantId == userId || r.LandlordId == userId);

            int totalCount = query.Count();

            var items = query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToList();

            var result = new PagedResult<RentalContract>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> GetRentalContractByIdAsync(Guid id)
    {
        try
        {
            RentalContract rentalContract = await this.rentalContractService.RetrieveRentalContractByIdAsync(id);
            return Ok(rentalContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
            when (rentalContractDependencyValidationException.InnerException is NotFoundRentalContractException)
        {
            return NotFound(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
        {
            return BadRequest(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("my")]
    [Authorize]
    public ActionResult<IEnumerable<RentalContract>> GetMyRentalContracts([FromQuery] string? status = null)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            var query = this.rentalContractService
                .RetrieveAllRentalContracts()
                .Where(contractItem => contractItem.TenantId == currentUserId || contractItem.LandlordId == currentUserId);

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ContractStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(contractItem => contractItem.Status == parsedStatus);
            }

            return Ok(query.OrderByDescending(contractItem => contractItem.CreatedDate).ToList());
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("by-user/{userId:guid}")]
    [Authorize]
    public ActionResult<IEnumerable<RentalContract>> GetContractsByUserId(Guid userId)
    {
        try
        {
            var contracts = this.rentalContractService
                .RetrieveAllRentalContracts()
                .Where(contractItem => contractItem.TenantId == userId || contractItem.LandlordId == userId)
                .OrderByDescending(contractItem => contractItem.CreatedDate)
                .ToList();

            return Ok(contracts);
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("by-booking/{bookingId:guid}")]
    [Authorize]
    public ActionResult<RentalContract> GetContractByBookingId(Guid bookingId)
    {
        try
        {
            var contractItem = this.rentalContractService
                .RetrieveAllRentalContracts()
                .FirstOrDefault(contractRecord => contractRecord.HomeRequestId == bookingId);

            if (contractItem is null)
            {
                return NotFound(new { message = "Contract not found for booking." });
            }

            return Ok(contractItem);
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPost("from-booking/{bookingId:guid}")]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> CreateContractFromBooking(Guid bookingId, [FromBody] CreateFromBookingRequest request)
    {
        try
        {
            var booking = this.bookingService
                .RetrieveAllBookings()
                .Include(bookingItem => bookingItem.Property)
                .FirstOrDefault(bookingItem => bookingItem.Id == bookingId);

            if (booking is null)
            {
                return NotFound(new { message = "Booking not found." });
            }

            var now = DateTimeOffset.UtcNow;
            var newContract = new RentalContract
            {
                Id = Guid.NewGuid(),
                Status = ContractStatus.Pending,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                MonthlyRent = request.MonthlyRent,
                SecurityDeposit = request.SecurityDeposit,
                Terms = request.Terms ?? string.Empty,
                DocumentUrl = string.Empty,
                IsSigned = false,
                TenantId = booking.GuestId,
                LandlordId = booking.Property.HostId,
                PropertyId = booking.PropertyId,
                HomeRequestId = bookingId,
                CreatedDate = now,
                UpdatedDate = now
            };

            var addedContract = await this.rentalContractService.AddRentalContractAsync(newContract);
            return Created($"api/rental-contracts/{addedContract.Id}", addedContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
        {
            return BadRequest(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPost("{id:guid}/sign")]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> SignContract(Guid id)
    {
        try
        {
            var contractItem = await this.rentalContractService.RetrieveRentalContractByIdAsync(id);
            contractItem.IsSigned = true;
            contractItem.SignedAt = DateTimeOffset.UtcNow;
            contractItem.Status = ContractStatus.Active;

            var modifiedContract = await this.rentalContractService.ModifyRentalContractAsync(contractItem);
            return Ok(modifiedContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
            when (rentalContractDependencyValidationException.InnerException is NotFoundRentalContractException)
        {
            return NotFound(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> UpdateContractStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        try
        {
            var contractItem = await this.rentalContractService.RetrieveRentalContractByIdAsync(id);
            contractItem.Status = request.Status;

            var modifiedContract = await this.rentalContractService.ModifyRentalContractAsync(contractItem);
            return Ok(modifiedContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
            when (rentalContractDependencyValidationException.InnerException is NotFoundRentalContractException)
        {
            return NotFound(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPost("{id:guid}/terminate")]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> TerminateContract(Guid id, [FromBody] TerminateContractRequest request)
    {
        try
        {
            var contractItem = await this.rentalContractService.RetrieveRentalContractByIdAsync(id);
            contractItem.Status = ContractStatus.Terminated;
            contractItem.EndDate = DateTimeOffset.UtcNow;
            contractItem.Terms = string.IsNullOrWhiteSpace(request.Reason)
                ? contractItem.Terms
                : $"{contractItem.Terms}\n\nTermination reason: {request.Reason}";

            var modifiedContract = await this.rentalContractService.ModifyRentalContractAsync(contractItem);
            return Ok(modifiedContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
            when (rentalContractDependencyValidationException.InnerException is NotFoundRentalContractException)
        {
            return NotFound(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("{id:guid}/pdf")]
    [Authorize]
    public async ValueTask<ActionResult> GetContractPdf(Guid id)
    {
        try
        {
            var contractItem = await this.rentalContractService.RetrieveRentalContractByIdAsync(id);
            var pdfText = $"Rental Contract\nId: {contractItem.Id}\nTenantId: {contractItem.TenantId}\nLandlordId: {contractItem.LandlordId}\nStart: {contractItem.StartDate:yyyy-MM-dd}\nEnd: {contractItem.EndDate:yyyy-MM-dd}\nMonthly Rent: {contractItem.MonthlyRent}";
            var bytes = Encoding.UTF8.GetBytes(pdfText);

            return File(bytes, "application/pdf", $"contract-{id}.pdf");
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
            when (rentalContractDependencyValidationException.InnerException is NotFoundRentalContractException)
        {
            return NotFound(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("templates")]
    [Authorize]
    public ActionResult<object> GetContractTemplates()
    {
        return Ok(new[]
        {
            new { id = "standard", name = "Standard Rental Contract", description = "Default rental contract template" }
        });
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> PutRentalContractAsync(RentalContract rentalContract)
    {
        try
        {
            RentalContract modifiedRentalContract = await this.rentalContractService.ModifyRentalContractAsync(rentalContract);
            return Ok(modifiedRentalContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
            when (rentalContractDependencyValidationException.InnerException is NotFoundRentalContractException)
        {
            return NotFound(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
        {
            return BadRequest(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<RentalContract>> DeleteRentalContractByIdAsync(Guid id)
    {
        try
        {
            RentalContract deletedRentalContract = await this.rentalContractService.RemoveRentalContractByIdAsync(id);
            return Ok(deletedRentalContract);
        }
        catch (RentalContractValidationException rentalContractValidationException)
        {
            return BadRequest(new { message = rentalContractValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
            when (rentalContractDependencyValidationException.InnerException is NotFoundRentalContractException)
        {
            return NotFound(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyValidationException rentalContractDependencyValidationException)
        {
            return BadRequest(new { message = rentalContractDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (RentalContractDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (RentalContractServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
