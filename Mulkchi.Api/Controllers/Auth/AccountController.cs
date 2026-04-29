using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Services.Foundations.Auth;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers.Auth;

[ApiController]
[Route("api/auth")]
public class AccountController : ControllerBase
{
    private const string AccessTokenCookie = "access_token";
    private const string RefreshTokenCookie = "refresh_token";

    private readonly IAuthService authService;

    public AccountController(IAuthService authService)
    {
        this.authService = authService;
    }

    [HttpPost("login")]
    public async ValueTask<ActionResult<AuthUserInfo>> LoginAsync(LoginRequest request)
    {
        try
        {
            AuthResponse response = await this.authService.LoginAsync(request);

            if (response is null)
                return Unauthorized(new { message = "Invalid email or password." });

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

    [HttpPost("register")]
    public async ValueTask<ActionResult<AuthUserInfo>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            AuthResponse response = await this.authService.RegisterAsync(request);

            if (response is null)
                return Unauthorized(new { message = "Registration failed." });

            SetAuthCookies(response);
            return Created("auth/register", new AuthUserInfo(response));
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (AuthDependencyValidationException authDependencyValidationException)
            when (authDependencyValidationException.InnerException is AlreadyExistsUserEmailException)
        {
            return Conflict(new { message = authDependencyValidationException.InnerException?.Message ?? "An error occurred." });
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

    [HttpPost("logout")]
    [Authorize]
    public async ValueTask<ActionResult> LogoutAsync([FromBody] RefreshTokenRequest? request = null)
    {
        try
        {
            string? refreshToken = Request.Cookies[RefreshTokenCookie];

            if (string.IsNullOrWhiteSpace(refreshToken))
                refreshToken = request?.RefreshToken;

            if (string.IsNullOrWhiteSpace(refreshToken))
                return BadRequest(new { message = "Refresh token is required." });

            await this.authService.LogoutAsync(refreshToken);
            ClearAuthCookies();
            return NoContent();
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

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async ValueTask<ActionResult<User>> GetCurrentUserAsync()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

        var user = await this.authService.RetrieveUserByIdAsync(currentUserId);
        return Ok(user);
    }

    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async ValueTask<ActionResult<User>> UpdateProfileAsync([FromBody] UpdateProfileRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

        var updatedUser = await this.authService.ModifyUserProfileAsync(currentUserId, request);
        return Ok(updatedUser);
    }

    [HttpDelete("account")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async ValueTask<ActionResult> DeleteAccountAsync()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

        await this.authService.RemoveUserByIdAsync(currentUserId);
        ClearAuthCookies();
        return Ok(new { message = "Hisob muvaffaqiyatli o'chirildi." });
    }

    [HttpPost("switch-role")]
    [Authorize]
    [ProducesResponseType(typeof(AuthUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async ValueTask<ActionResult<AuthUserInfo>> SwitchRoleAsync([FromBody] SwitchRoleRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

        try
        {
            if (request.TargetMode != UserRole.Guest && request.TargetMode != UserRole.Host)
                return BadRequest(new { message = "Faqat Guest yoki Host rejimga o'tish mumkin." });

            var user = await this.authService.RetrieveUserByIdAsync(currentUserId);
            
            if (request.TargetMode == UserRole.Host)
            {
                bool canBecomeHost = user.Role == UserRole.Host 
                    || user.Role == UserRole.Admin 
                    || user.Role == UserRole.SuperAdmin
                    || user.Role == UserRole.Agent
                    || user.EmailConfirmed;

                if (!canBecomeHost)
                    return BadRequest(new { message = "Host rejimga o'tish uchun hisobingizni tasdiqlang yoki moderator bilan bog'laning." });

                if (user.HostSince == null && user.Role != UserRole.Host)
                {
                    user.HostSince = DateTimeOffset.UtcNow;
                }
            }

            user.CurrentMode = request.TargetMode;
            user.ModeSwitchedAt = DateTimeOffset.UtcNow;
            user.UpdatedDate = DateTimeOffset.UtcNow;

            await this.authService.ModifyUserProfileAsync(currentUserId, new UpdateProfileRequest
            {
                CurrentMode = request.TargetMode
            });

            string refreshToken = request.RefreshToken 
                ?? Request.Cookies[RefreshTokenCookie] 
                ?? string.Empty;
            AuthResponse response = await this.authService.RefreshTokenAsync(refreshToken);
            
            response.CurrentMode = request.TargetMode;

            SetAuthCookies(response);
            return Ok(new AuthUserInfo(response));
        }
        catch (AuthValidationException authValidationException)
        {
            return BadRequest(new { message = authValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (Exception)
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

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete(AccessTokenCookie);
        Response.Cookies.Delete(RefreshTokenCookie);
    }
}
