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
[Authorize]
public class AccountController : ControllerBase
{
    private readonly IAuthService authService;

    public AccountController(IAuthService authService)
    {
        this.authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
        catch (NotFoundUserByEmailException)
        {
            return NotFound(new { message = "User not found." });
        }
        catch (InvalidCredentialAuthException)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }
        catch (AuthDependencyValidationException ex) when (ex.InnerException is NotFoundUserByEmailException)
        {
            return NotFound(new { message = "Email yoki parol noto'g'ri." });
        }
        catch (AuthDependencyValidationException ex)
        {
            if (ex.InnerException is NotFoundUserByEmailException)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
        }
        catch (AuthValidationException ex)
        {
            return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthUserInfo), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async ValueTask<ActionResult<AuthUserInfo>> RegisterAsync(RegisterRequest request)
    {
        AuthResponse response = await this.authService.RegisterAsync(request);

        if (response is null)
            return Unauthorized(new { message = "Registration failed." });

        SetAuthCookies(response);
        return Created("auth/register", new AuthUserInfo(response));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async ValueTask<ActionResult> LogoutAsync()
    {
        if (!AuthCookieHelper.ValidateXsrfToken(Request))
            return Forbid();

        string? refreshToken = Request.Cookies[AuthCookieHelper.RefreshTokenCookie];

        if (!string.IsNullOrWhiteSpace(refreshToken))
            await this.authService.LogoutAsync(refreshToken);

        ClearAuthCookies();
        return NoContent();
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
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async ValueTask<ActionResult<User>> UpdateProfileAsync([FromBody] UpdateProfileRequest request)
    {
        if (!AuthCookieHelper.ValidateXsrfToken(Request))
            return Forbid();

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

        var updatedUser = await this.authService.ModifyUserProfileAsync(currentUserId, request);
        return Ok(updatedUser);
    }

    [HttpDelete("account")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async ValueTask<ActionResult> DeleteAccountAsync()
    {
        if (!AuthCookieHelper.ValidateXsrfToken(Request))
            return Forbid();

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

        await this.authService.RemoveUserByIdAsync(currentUserId);
        ClearAuthCookies();
        return Ok(new { message = "Hisob muvaffaqiyatli o'chirildi." });
    }

    [HttpPost("switch-role")]
    [ProducesResponseType(typeof(AuthUserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async ValueTask<ActionResult<AuthUserInfo>> SwitchRoleAsync([FromBody] SwitchRoleRequest request)
    {
        if (!AuthCookieHelper.ValidateXsrfToken(Request))
            return Forbid();

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
            return Unauthorized();

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

        string refreshToken = Request.Cookies[AuthCookieHelper.RefreshTokenCookie] ?? string.Empty;
        AuthResponse response = await this.authService.RefreshTokenAsync(refreshToken);

        response.CurrentMode = request.TargetMode;

        SetAuthCookies(response);
        return Ok(new AuthUserInfo(response));
    }

    private void SetAuthCookies(AuthResponse response)
    {
        AuthCookieHelper.SetAuthCookies(Response, response);
    }

    private void ClearAuthCookies()
    {
        AuthCookieHelper.ClearAuthCookies(Response);
    }
}
