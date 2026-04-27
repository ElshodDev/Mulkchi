using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class SocialAuthController : ControllerBase
{
    private const string AccessTokenCookie = "access_token";
    private const string RefreshTokenCookie = "refresh_token";

    private readonly IAuthService authService;

    public SocialAuthController(IAuthService authService)
    {
        this.authService = authService;
    }

    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async ValueTask<ActionResult<AuthUserInfo>> LoginWithGoogleAsync([FromBody] GoogleLoginRequest request)
    {
        try
        {
            AuthResponse response = await this.authService.LoginWithGoogleAsync(request.IdToken);
            SetAuthCookies(response);
            return Ok(new AuthUserInfo(response));
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

    [HttpPost("telegram")]
    [ProducesResponseType(typeof(AuthUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async ValueTask<ActionResult<AuthUserInfo>> LoginWithTelegramAsync([FromBody] TelegramAuthRequest request)
    {
        try
        {
            AuthResponse response = await this.authService.LoginWithTelegramAsync(request);
            SetAuthCookies(response);
            return Ok(new AuthUserInfo(response));
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyValidationException authDependencyValidationException)
        {
            return BadRequest(new { message = authDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
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
