using System.Runtime.CompilerServices;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Mulkchi.Api.Hubs;
using Mulkchi.Api.Models.Foundations.Notifications;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/sse/notifications")]
[Authorize]
public class SseNotificationsController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<SseNotificationsController> _logger;

    public SseNotificationsController(
        IHubContext<NotificationHub> hubContext,
        ILogger<SseNotificationsController> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Server-Sent Events endpoint for notifications
    /// Alternative to SignalR WebSocket for one-way server-to-client communication
    /// </summary>
    [HttpGet("stream")]
    [Produces("text/event-stream")]
    public async IAsyncEnumerable<Notification> GetNotificationStream(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("SSE connection attempted without user ID");
            yield break;
        }

        _logger.LogInformation("SSE connection established for user {UserId}", userId);

        // Send initial heartbeat
        yield return new Notification 
        { 
            Type = NotificationType.SystemAlert,
            TitleUz = "Connected",
            BodyUz = "SSE stream established"
        };

        // Keep connection alive with heartbeat every 30 seconds
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            
            // Send heartbeat to keep connection alive
            yield return new Notification
            {
                Type = NotificationType.SystemAlert,
                TitleUz = "Heartbeat",
                BodyUz = DateTime.UtcNow.ToString("O")
            };
        }

        _logger.LogInformation("SSE connection closed for user {UserId}", userId);
    }
}
