using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Controllers.Auth;

[ApiController]
[Route("api/auth/email")]
[Tags("Authentication")]
public class EmailAuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public EmailAuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("send-code")]
    public async ValueTask<ActionResult<object>> SendCode([FromBody] EmailAuthRequest? request)
    {
        if (request == null)
            return BadRequest(new { message = "Request body is required." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email address is required." });

        // Basic email validation
        if (!request.Email.Contains("@") || !request.Email.Contains("."))
            return BadRequest(new { message = "Invalid email format." });

        try
        {
            var sessionId = await _authService.SendEmailCodeAsync(request.Email);
            return Ok(new { sessionId, message = "Verification code sent to your email." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Failed to send code: {ex.Message}" });
        }
    }

    [HttpPost("verify-code")]
    public async ValueTask<ActionResult<AuthResponse>> VerifyCode([FromBody] EmailVerifyRequest request)
    {
        var response = await _authService.VerifyEmailCodeAsync(request.SessionId, request.Code);
        
        AuthCookieHelper.SetAuthCookies(HttpContext.Response, response);

        return Ok(response);
    }
}
