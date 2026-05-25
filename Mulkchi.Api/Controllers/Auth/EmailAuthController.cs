using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Auth;
using System.Text.RegularExpressions;

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
            string errorMessage = GetInnermostMessage(ex);

            if (IsDevelopment() && TryExtractDevelopmentCode(errorMessage, out string sessionId, out string code))
            {
                return Ok(new
                {
                    sessionId,
                    devCode = code,
                    message = "Development mode: SMTP failed, using generated verification code."
                });
            }

            return BadRequest(new { message = $"Failed to send code: {errorMessage}" });
        }
    }

    [HttpPost("verify-code")]
    public async ValueTask<ActionResult<AuthResponse>> VerifyCode([FromBody] EmailVerifyRequest request)
    {
        var response = await _authService.VerifyEmailCodeAsync(request.SessionId, request.Code);

        AuthCookieHelper.SetAuthCookies(HttpContext.Response, response);

        return Ok(response);
    }

    private static bool IsDevelopment() =>
        string.Equals(
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            "Development",
            StringComparison.OrdinalIgnoreCase);

    private static bool TryExtractDevelopmentCode(string message, out string sessionId, out string code)
    {
        Match codeMatch = Regex.Match(message, @"KOD:\s*(\d+)");
        Match sessionMatch = Regex.Match(message, @"SESSION:\s*([\w-]+)");

        code = codeMatch.Success ? codeMatch.Groups[1].Value : string.Empty;
        sessionId = sessionMatch.Success ? sessionMatch.Groups[1].Value : string.Empty;

        return codeMatch.Success && sessionMatch.Success;
    }

    private static string GetInnermostMessage(Exception exception)
    {
        Exception currentException = exception;

        while (currentException.InnerException is not null)
        {
            currentException = currentException.InnerException;
        }

        return currentException.Message;
    }
}
