using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Services.Foundations.Notifications;
using Mulkchi.Api.Services.Foundations.Users;

namespace Mulkchi.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly INotificationService notificationService;
    private readonly IUserConnectionTracker connectionTracker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;

    public NotificationHub(
        INotificationService notificationService,
        IUserConnectionTracker connectionTracker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker)
    {
        this.notificationService = notificationService;
        this.connectionTracker = connectionTracker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
    }

    public async Task SendNotificationToUser(string userId, string titleUz, string titleRu, string titleEn, string bodyUz, string bodyRu, string bodyEn, string type = "info")
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return;

        try
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = Guid.Parse(userId),
                TitleUz = titleUz,
                TitleRu = titleRu,
                TitleEn = titleEn,
                BodyUz = bodyUz,
                BodyRu = bodyRu,
                BodyEn = bodyEn,
                Type = Enum.Parse<NotificationType>(type, true),
                IsRead = false,
                CreatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset(),
                UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset()
            };

            Notification savedNotification = await this.notificationService.AddNotificationAsync(notification);

            await Clients.User(userId).SendAsync("ReceiveNotification", new
            {
                savedNotification.Id,
                savedNotification.TitleUz,
                savedNotification.TitleRu,
                savedNotification.TitleEn,
                savedNotification.BodyUz,
                savedNotification.BodyRu,
                savedNotification.BodyEn,
                savedNotification.Type,
                savedNotification.IsRead,
                savedNotification.CreatedDate,
                Timestamp = this.dateTimeBroker.GetCurrentDateTimeOffset()
            });

            await Clients.Caller.SendAsync("NotificationSent", savedNotification);
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    public async Task BroadcastAnnouncement(string titleUz, string titleRu, string titleEn, string bodyUz, string bodyRu, string bodyEn, string type = "announcement")
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return;

        // Only admins may send system-wide announcements
        if (!Context.User!.IsInRole("Admin"))
            throw new HubException("Unauthorized: Only administrators can broadcast announcements.");

        try
        {
            var announcement = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = Guid.Empty,
                TitleUz = titleUz,
                TitleRu = titleRu,
                TitleEn = titleEn,
                BodyUz = bodyUz,
                BodyRu = bodyRu,
                BodyEn = bodyEn,
                Type = NotificationType.SystemAlert,
                IsRead = false,
                CreatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset(),
                UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset()
            };

            await Clients.All.SendAsync("ReceiveAnnouncement", new
            {
                announcement.Id,
                announcement.TitleUz,
                announcement.TitleRu,
                announcement.TitleEn,
                announcement.BodyUz,
                announcement.BodyRu,
                announcement.BodyEn,
                announcement.Type,
                announcement.CreatedDate,
                SenderId = senderId,
                Timestamp = this.dateTimeBroker.GetCurrentDateTimeOffset()
            });

            await Clients.Caller.SendAsync("AnnouncementSent", announcement);
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    public async Task MarkNotificationAsRead(Guid notificationId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var notification = await this.notificationService.RetrieveNotificationByIdAsync(notificationId);

            if (notification.UserId.ToString() != userId)
                throw new HubException("Unauthorized: You can only mark your own notifications as read.");

            notification.IsRead = true;
            notification.ReadAt = this.dateTimeBroker.GetCurrentDateTimeOffset();
            notification.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

            var updatedNotification = await this.notificationService.ModifyNotificationAsync(notification);

            await Clients.Caller.SendAsync("NotificationRead", new
            {
                updatedNotification.Id,
                updatedNotification.ReadAt,
                Timestamp = this.dateTimeBroker.GetCurrentDateTimeOffset()
            });
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            this.connectionTracker.AddConnection(userId, Context.ConnectionId);
            this.loggingBroker.LogInformation(
                $"User {userId} connected to NotificationHub: {Context.ConnectionId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            this.connectionTracker.RemoveConnection(Context.ConnectionId);
            this.loggingBroker.LogInformation(
                $"User {userId} disconnected from NotificationHub: {Context.ConnectionId}");
        }

        if (exception is not null)
            this.loggingBroker.LogError(exception);

        await base.OnDisconnectedAsync(exception);
    }
}

