using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Mulkchi.Api.Hubs;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Models.Foundations.Notifications.Exceptions;
using Mulkchi.Api.Services.Foundations.Notifications;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService notificationService;
    private readonly IHubContext<NotificationHub> notificationHub;

    public NotificationsController(
        INotificationService notificationService,
        IHubContext<NotificationHub> notificationHub)
    {
        this.notificationService = notificationService;
        this.notificationHub = notificationHub;
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<NotificationDto>> PostNotificationAsync(Notification notification)
    {
        try
        {
            Notification addedNotification = await this.notificationService.AddNotificationAsync(notification);

            await this.notificationHub.Clients.User(notification.UserId.ToString())
                .SendAsync("ReceiveNotification", MapToDto(addedNotification));

            return Created("notification", MapToDto(addedNotification));
        }
        catch (NotificationValidationException ex) { return BadRequest(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (NotificationDependencyValidationException ex) { return BadRequest(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (Exception) { return StatusCode(500, new { message = "Internal server error." }); }
    }

    [HttpGet]
    [Authorize]
    public ActionResult<PagedResult<NotificationDto>> GetAllNotifications([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<Notification> query = this.notificationService.RetrieveAllNotifications();
            int totalCount = query.Count();

            var items = query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToList()
                .Select(MapToDto)
                .Where(dto => dto != null)
                .Select(dto => dto!)
                .ToList();

            return Ok(new PagedResult<NotificationDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            });
        }
        catch (Exception) { return StatusCode(500, new { message = "Internal server error." }); }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<NotificationDto>> GetNotificationByIdAsync(Guid id)
    {
        try
        {
            Notification notification = await this.notificationService.RetrieveNotificationByIdAsync(id);
            return Ok(MapToDto(notification));
        }
        catch (NotificationValidationException ex) { return BadRequest(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (NotificationDependencyValidationException ex) when (ex.InnerException is NotFoundNotificationException) { return NotFound(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (NotificationDependencyValidationException ex) { return BadRequest(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (Exception) { return StatusCode(500, new { message = "Internal server error." }); }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<NotificationDto>> PutNotificationAsync(Notification notification)
    {
        try
        {
            Notification modifiedNotification = await this.notificationService.ModifyNotificationAsync(notification);
            return Ok(MapToDto(modifiedNotification));
        }
        catch (NotificationValidationException ex) { return BadRequest(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (NotificationDependencyValidationException ex) when (ex.InnerException is NotFoundNotificationException) { return NotFound(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (NotificationDependencyValidationException ex) { return BadRequest(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (Exception) { return StatusCode(500, new { message = "Internal server error." }); }
    }

    [HttpPut("{id}/read")]
    [Authorize]
    public async ValueTask<ActionResult> MarkNotificationAsReadAsync(Guid id)
    {
        try
        {
            Notification notification = await this.notificationService.RetrieveNotificationByIdAsync(id);
            notification.IsRead = true;
            notification.ReadAt = DateTimeOffset.UtcNow;
            await this.notificationService.ModifyNotificationAsync(notification);
            return NoContent();
        }
        catch (NotificationDependencyValidationException ex) when (ex.InnerException is NotFoundNotificationException) { return NotFound(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (Exception) { return BadRequest(new { message = "An error occurred." }); }
    }

    [HttpPut("read-all")]
    [Authorize]
    public async ValueTask<ActionResult> MarkAllNotificationsAsReadAsync()
    {
        try
        {
            var unreadNotifications = this.notificationService
                .RetrieveAllNotifications()
                .Where(n => !n.IsRead)
                .ToList();

            foreach (Notification n in unreadNotifications)
            {
                n.IsRead = true;
                n.ReadAt = DateTimeOffset.UtcNow;
                await this.notificationService.ModifyNotificationAsync(n);
            }
            return NoContent();
        }
        catch (Exception) { return StatusCode(500, new { message = "Internal server error." }); }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<NotificationDto>> DeleteNotificationByIdAsync(Guid id)
    {
        try
        {
            Notification deletedNotification = await this.notificationService.RemoveNotificationByIdAsync(id);
            return Ok(MapToDto(deletedNotification));
        }
        catch (NotificationDependencyValidationException ex) when (ex.InnerException is NotFoundNotificationException) { return NotFound(new { message = ex.InnerException?.Message ?? "An error occurred." }); }
        catch (Exception) { return StatusCode(500, new { message = "Internal server error." }); }
    }

    private NotificationDto? MapToDto(Notification? notification)
    {
        if (notification == null) return null;
        
        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.TitleUz ?? notification.TitleRu ?? notification.TitleEn ?? string.Empty,
            Message = notification.BodyUz ?? notification.BodyRu ?? notification.BodyEn ?? string.Empty,
            Type = notification.Type switch
            {
                NotificationType.BookingRequest => "booking",
                NotificationType.BookingApproved => "success",
                NotificationType.BookingRejected => "error",
                NotificationType.PaymentReceived => "success",
                NotificationType.NewMessage => "message",
                NotificationType.ReviewReceived => "info",
                NotificationType.SystemAlert => "system",
                _ => "info"
            },
            Category = notification.Type switch
            {
                NotificationType.BookingRequest => "Booking",
                NotificationType.BookingApproved => "Booking",
                NotificationType.BookingRejected => "Booking",
                NotificationType.PaymentReceived => "Payment",
                NotificationType.NewMessage => "Message",
                NotificationType.ReviewReceived => "Review",
                NotificationType.SystemAlert => "System",
                _ => "System"
            },
            Data = !string.IsNullOrEmpty(notification.ActionUrl) 
                ? new Dictionary<string, object> { { "url", notification.ActionUrl } } 
                : null,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedDate,
            ReadAt = notification.ReadAt
        };
    }
}
