using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class TokenController : ControllerBase
{
    private const string AccessTokenCookie = "access_token";
    private const string RefreshTokenCookie = "refresh_token";

    private readonly IAuthService authService;

    public TokenController(IAuthService authService)
    {
        this.authService = authService;
    }

    [HttpPost("refresh-token")]
    public async ValueTask<ActionResult<AuthUserInfo>> RefreshTokenAsync([FromBody] RefreshTokenRequest? request = null)
    {
        try
        {
            string? refreshToken = Request.Cookies[RefreshTokenCookie];

            if (string.IsNullOrWhiteSpace(refreshToken))
                refreshToken = request?.RefreshToken;

            if (string.IsNullOrWhiteSpace(refreshToken))
                return BadRequest(new { message = "Refresh token is required." });

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
    }

    private void SetAuthCookies(AuthResponse response)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = response.ExpiresAt
        };

        Response.Cookies.Append(AccessTokenCookie, response.Token, cookieOptions);
        Response.Cookies.Append(RefreshTokenCookie, response.RefreshToken, cookieOptions);
    }
}
