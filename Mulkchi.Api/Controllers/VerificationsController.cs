using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Verifications;
using Mulkchi.Api.Services.Foundations.Verifications;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VerificationsController : ControllerBase
{
    private readonly IVerificationService verificationService;

    public VerificationsController(IVerificationService verificationService)
    {
        this.verificationService = verificationService;
    }

    [HttpPost]
    public async ValueTask<ActionResult<Verification>> PostVerificationAsync(Verification verification)
    {
        try
        {
            // Xavfsizlik uchun faqat o'zi haqidagi ma'lumotni saqlaydi
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdStr != null)
            {
                verification.UserId = Guid.Parse(userIdStr);
            }

            Verification addedVerification = await this.verificationService.SubmitVerificationAsync(verification);
            return Created($"/api/verifications/{addedVerification.Id}", addedVerification);
        }
        catch (Exception exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpGet("{verificationId}")]
    public async ValueTask<ActionResult<Verification>> GetVerificationByIdAsync(Guid verificationId)
    {
        try
        {
            Verification verification = await this.verificationService.RetrieveVerificationByIdAsync(verificationId);
            return Ok(verification);
        }
        catch (Exception exception)
        {
            return NotFound(exception.Message);
        }
    }

    [HttpPost("{verificationId}/verify")]
    [Authorize(Roles = "Admin")] // Faqat admin (yoki ichki tizim) AI ni ishga tushirishi kerak
    public async ValueTask<ActionResult<Verification>> VerifyIdentityAsync(Guid verificationId)
    {
        try
        {
            Verification verifiedData = await this.verificationService.VerifyIdentityAsync(verificationId);
            return Ok(verifiedData);
        }
        catch (Exception exception)
        {
            return BadRequest(exception.Message);
        }
    }
}
