using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Auth.Exceptions;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Services.Foundations.Auth;
using System.Security.Claims;

// TODO: DELETE AuthController.cs after testing. Logic has been moved to Auth/AccountController, Auth/TokenController, etc.
namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string AccessTokenCookie = "access_token";
    private const string RefreshTokenCookie = "refresh_token";

    private readonly IAuthService authService;

    public AuthController(IAuthService authService)
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

    // ─── Single Identity: Role Switching ─────────────────────────────────────

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
            // Validate requested role
            if (request.TargetMode != UserRole.Guest && request.TargetMode != UserRole.Host)
                return BadRequest(new { message = "Faqat Guest yoki Host rejimga o'tish mumkin." });

            // Get current user
            var user = await this.authService.RetrieveUserByIdAsync(currentUserId);
            
            // Check if user can switch to Host mode
            if (request.TargetMode == UserRole.Host)
            {
                // Allow switch if:
                // 1. User is already a Host role, OR
                // 2. User has verified email, OR
                // 3. User is Admin/SuperAdmin
                bool canBecomeHost = user.Role == UserRole.Host 
                    || user.Role == UserRole.Admin 
                    || user.Role == UserRole.SuperAdmin
                    || user.Role == UserRole.Agent
                    || user.EmailConfirmed;

                if (!canBecomeHost)
                    return BadRequest(new { message = "Host rejimga o'tish uchun hisobingizni tasdiqlang yoki moderator bilan bog'laning." });

                // If this is first time becoming host, update HostSince
                if (user.HostSince == null && user.Role != UserRole.Host)
                {
                    user.HostSince = DateTimeOffset.UtcNow;
                }
            }

            // Update current mode
            user.CurrentMode = request.TargetMode;
            user.ModeSwitchedAt = DateTimeOffset.UtcNow;
            user.UpdatedDate = DateTimeOffset.UtcNow;

            // Save changes through profile update
            await this.authService.ModifyUserProfileAsync(currentUserId, new UpdateProfileRequest
            {
                CurrentMode = request.TargetMode
            });

            // Generate new tokens with updated mode
            // Try to get refresh token from request body first, then fallback to cookie
            string refreshToken = request.RefreshToken 
                ?? Request.Cookies[RefreshTokenCookie] 
                ?? string.Empty;
            AuthResponse response = await this.authService.RefreshTokenAsync(refreshToken);
            
            // Override the current mode in response
            response.CurrentMode = request.TargetMode;

            SetAuthCookies(response);
            return Ok(new AuthUserInfo(response));
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

    // ─── Cookie helpers ──────────────────────────────────────────────────────

    private void SetAuthCookies(AuthResponse response)
    {
        bool isProduction = HttpContext.RequestServices
            .GetRequiredService<IWebHostEnvironment>()
            .IsProduction();

        SameSiteMode sameSiteMode = isProduction
            ? SameSiteMode.None
            : SameSiteMode.Lax;

        var accessOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = sameSiteMode,
            Expires = response.ExpiresAt,
            Path = "/"
        };

        var refreshOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = sameSiteMode,
            Expires = DateTimeOffset.UtcNow.AddDays(AuthService.RefreshTokenExpiryDays),
            Path = "/"
        };

        Response.Cookies.Append(AccessTokenCookie, response.Token, accessOptions);
        Response.Cookies.Append(RefreshTokenCookie, response.RefreshToken, refreshOptions);
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete(AccessTokenCookie, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(RefreshTokenCookie, new CookieOptions { Path = "/" });
    }
}
