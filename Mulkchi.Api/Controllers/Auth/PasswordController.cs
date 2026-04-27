using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class PasswordController : ControllerBase
{
    private readonly IAuthService authService;

    public PasswordController(IAuthService authService)
    {
        this.authService = authService;
    }

    [HttpPost("forgot-password")]
    public async ValueTask<ActionResult> ForgotPasswordAsync([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await this.authService.ForgotPasswordAsync(request.Email);
            return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AuthServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPost("reset-password")]
    public async ValueTask<ActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await this.authService.ResetPasswordAsync(request.Token, request.NewPassword);
            return Ok(new { message = "Password has been reset successfully." });
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyValidationException authDependencyValidationException)
            when (authDependencyValidationException.InnerException is NotFoundPasswordResetTokenException)
        {
            return BadRequest(new { message = "Invalid or expired reset token." });
        }
        catch (AuthDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AuthServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async ValueTask<ActionResult> VerifyEmailAsync([FromQuery] string token)
    {
        try
        {
            await this.authService.VerifyEmailAsync(token);
            return Ok(new { message = "Email muvaffaqiyatli tasdiqlandi." });
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyValidationException authDependencyValidationException)
        {
            return BadRequest(new { message = authDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AuthServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPost("send-otp")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async ValueTask<ActionResult> SendOtpAsync([FromBody] SendOtpRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

        try
        {
            await this.authService.SendPhoneOtpAsync(currentUserId, request.Phone);
            return Ok(new { message = "OTP kodi yuborildi." });
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AuthServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPost("verify-otp")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async ValueTask<ActionResult> VerifyOtpAsync([FromBody] VerifyOtpRequest request)
    {
        try
        {
            await this.authService.VerifyPhoneOtpAsync(request.Phone, request.Code);
            return Ok(new { message = "Telefon raqam tasdiqlandi." });
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyValidationException authDependencyValidationException)
        {
            return BadRequest(new { message = authDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (AuthServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }
}
