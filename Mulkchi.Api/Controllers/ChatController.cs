using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Chat;
using Mulkchi.Api.Services.Foundations.Chat;
using System.Security.Claims;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService chatService;

    public ChatController(IChatService chatService)
    {
        this.chatService = chatService;
    }

    [HttpPost("ai")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<AIChatResponse>> AIChatAsync([FromBody] AIChatRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = null;
            if (userIdClaim != null && Guid.TryParse(userIdClaim, out Guid parsedId))
            {
                userId = parsedId;
            }

            var response = await this.chatService.ProcessMessageAsync(request, userId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("sessions")]
    [Authorize]
    public async ValueTask<ActionResult<ChatSession>> StartSessionAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var session = await this.chatService.StartSessionAsync(userId);
            return Ok(session);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("sessions/{sessionId}")]
    [Authorize]
    public async ValueTask<ActionResult> EndSessionAsync(string sessionId)
    {
        try
        {
            await this.chatService.EndSessionAsync(sessionId);
            return Ok(new { message = "Session ended successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("sessions/my")]
    [Authorize]
    public async ValueTask<ActionResult<IEnumerable<ChatSession>>> GetMySessionsAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var sessions = await this.chatService.GetUserSessionsAsync(userId);
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("sessions/{sessionId}/messages")]
    [Authorize]
    public async ValueTask<ActionResult<IEnumerable<ChatMessage>>> GetSessionMessagesAsync(string sessionId)
    {
        try
        {
            var messages = await this.chatService.GetSessionMessagesAsync(sessionId);
            return Ok(messages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("detect-intent")]
    [AllowAnonymous]
    public async ValueTask<ActionResult<object>> DetectIntentAsync([FromBody] string message)
    {
        try
        {
            var intent = await this.chatService.DetectIntentAsync(message);
            return Ok(new { intent, message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
