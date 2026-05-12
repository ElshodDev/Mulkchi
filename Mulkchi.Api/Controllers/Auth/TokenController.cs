using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Controllers.Auth;

[ApiController]
[Route("api/auth")]
public class TokenController : ControllerBase
{
    private readonly IAuthService authService;
    private readonly ILogger<TokenController> logger;

    public TokenController(IAuthService authService, ILogger<TokenController> logger)
    {
        this.authService = authService;
        this.logger = logger;
    }

    [HttpPost("refresh-token")]
    public async ValueTask<ActionResult<AuthUserInfo>> RefreshTokenAsync()
    {
        try
        {
            this.logger.LogDebug(
                "Refresh-token request received. Cookies: {Cookies}. HasRefreshCookie: {HasRefreshCookie}. HasXsrfCookie: {HasXsrfCookie}. HasXsrfHeader: {HasXsrfHeader}. HasAuthorizationHeader: {HasAuthorizationHeader}.",
                string.Join(", ", Request.Cookies.Keys),
                Request.Cookies.ContainsKey(AuthCookieHelper.RefreshTokenCookie),
                Request.Cookies.ContainsKey(AuthCookieHelper.XsrfTokenCookie),
                Request.Headers.ContainsKey(AuthCookieHelper.XsrfHeaderName),
                Request.Headers.ContainsKey("Authorization"));

            if (!AuthCookieHelper.ValidateXsrfToken(Request))
            {
                this.logger.LogWarning("Refresh-token request rejected because the XSRF token was missing or invalid.");
                return Forbid();
            }

            string? refreshToken = Request.Cookies[AuthCookieHelper.RefreshTokenCookie];

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                this.logger.LogWarning("Refresh-token request rejected because the refresh cookie was missing.");
                return BadRequest(new { message = "Refresh token is required." });
            }

            AuthResponse response = await this.authService.RefreshTokenAsync(refreshToken);
            SetAuthCookies(response);
            return Ok(new AuthUserInfo(response));
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyValidationException authDependencyValidationException)
            when (authDependencyValidationException.InnerException is NotFoundUserByEmailException)
        {
            return NotFound(new { message = authDependencyValidationException.InnerException?.Message ?? "An error occurred." });
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
        catch (Exception exception)
        {
            this.logger.LogError(exception, "Unexpected error while processing refresh-token request.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    private void SetAuthCookies(AuthResponse response)
    {
        AuthCookieHelper.SetAuthCookies(Response, response);
    }
}
