using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Mulkchi.Api.Hubs;
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Services.Notifications;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/sse/notifications")]
[Authorize]
public class SseNotificationsController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;
    private readonly ILogger<SseNotificationsController> _logger;

    public SseNotificationsController(
        IHubContext<NotificationHub> hubContext,
        INotificationService notificationService,
        ILogger<SseNotificationsController> logger)
    {
        _hubContext = hubContext;
        _notificationService = notificationService;
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
            Type = NotificationType.System,
            Title = "Connected",
            Message = "SSE stream established"
        };

        // Poll for new notifications every 5 seconds
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var notifications = await _notificationService
                    .GetUnreadNotificationsAsync(Guid.Parse(userId), cancellationToken);
                
                foreach (var notification in notifications)
                {
                    yield return notification;
                }

                await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SSE notification stream");
                break;
            }
        }

        _logger.LogInformation("SSE connection closed for user {UserId}", userId);
    }
}
