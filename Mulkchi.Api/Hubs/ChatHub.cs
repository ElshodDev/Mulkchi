using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Models.Foundations.Messages;
using Mulkchi.Api.Services.Foundations.Messages;

namespace Mulkchi.Api.Hubs;

[AllowAnonymous]
public class ChatHub : Hub
{
    private readonly IMessageService messageService;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;

    public ChatHub(
        IMessageService messageService,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker)
    {
        this.messageService = messageService;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
    }

    // Send text message to specific user and save to DB
    public async Task SendMessage(Guid receiverId, string content, Guid? propertyId = null)
    {
        var userIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out Guid senderId))
            throw new HubException("Unauthorized: invalid or missing token.");

        if (string.IsNullOrWhiteSpace(content))
            throw new HubException("Message content cannot be empty.");

        await CreateAndDispatchMessageAsync(senderId, receiverId, content.Trim(), MessageType.Text, propertyId);
    }

    // Send file message to specific user and save to DB
    public async Task SendFileMessage(Guid receiverId, string fileUrl, string fileName, Guid? propertyId = null)
    {
        var userIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out Guid senderId))
            throw new HubException("Unauthorized: invalid or missing token.");

        if (string.IsNullOrWhiteSpace(fileUrl))
            throw new HubException("File URL cannot be empty.");

        string content = string.IsNullOrWhiteSpace(fileName)
            ? fileUrl.Trim()
            : $"{fileName.Trim()}|{fileUrl.Trim()}";

        await CreateAndDispatchMessageAsync(senderId, receiverId, content, MessageType.File, propertyId);
    }

    private async Task CreateAndDispatchMessageAsync(
        Guid senderId,
        Guid receiverId,
        string content,
        MessageType type,
        Guid? propertyId = null)
    {
        try
        {
            var message = new Message
            {
                Id = Guid.NewGuid(),
                SenderId = senderId,
                ReceiverId = receiverId,
                PropertyId = propertyId,
                Content = content,
                Type = type,
                IsRead = false,
                CreatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset(),
                UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset()
            };

            Message savedMessage = await this.messageService.AddMessageAsync(message);

            // Only send to receiver if they have a valid user ID
            if (!string.IsNullOrEmpty(receiverId.ToString()))
            {
                await Clients.User(receiverId.ToString())
                    .SendAsync("ReceiveMessage", savedMessage);
            }

            await Clients.Caller
                .SendAsync("MessageSent", savedMessage);
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw new HubException("Failed to send message: " + exception.Message);
        }
    }

    // Join a property chat room
    public async Task JoinPropertyRoom(Guid propertyId)
    {
        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, propertyId.ToString());
            await Clients.Group(propertyId.ToString())
                .SendAsync("UserJoined", Context.ConnectionId);
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    // Leave a property chat room
    public async Task LeavePropertyRoom(Guid propertyId)
    {
        try
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, propertyId.ToString());
            await Clients.Group(propertyId.ToString())
                .SendAsync("UserLeft", Context.ConnectionId);
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    // Typing indicator
    public async Task SendTypingIndicator(Guid receiverId, bool isTyping)
    {
        try
        {
            await Clients.User(receiverId.ToString())
                .SendAsync("UserTyping", Context.UserIdentifier, isTyping);
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    // Mark messages as read
    public async Task MarkAsRead(Guid messageId)
    {
        try
        {
            var userIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out Guid currentUserId))
                throw new HubException("Unauthorized: invalid or missing token.");

            Message message = await this.messageService.RetrieveMessageByIdAsync(messageId);

            if (message.ReceiverId != currentUserId)
                throw new HubException("Forbidden: you are not the receiver of this message.");

            if (message.IsRead)
            {
                await Clients.Caller.SendAsync("MessageRead", new { messageId, message.ReadAt });
                return;
            }

            message.IsRead = true;
            message.ReadAt = this.dateTimeBroker.GetCurrentDateTimeOffset();
            message.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

            Message updatedMessage = await this.messageService.ModifyMessageAsync(message);

            await Clients.User(message.SenderId.ToString())
                .SendAsync("MessageRead", new { messageId, updatedMessage.ReadAt });

            await Clients.Caller
                .SendAsync("MessageRead", new { messageId, updatedMessage.ReadAt });
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    public override async Task OnConnectedAsync()
    {
        try
        {
            this.loggingBroker.LogInformation(
                $"Client connected: {Context.ConnectionId}, UserId: {Context.UserIdentifier ?? "anonymous"}");
            await base.OnConnectedAsync();
        }
        catch (Exception exception)
        {
            this.loggingBroker.LogError(exception);
            throw;
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        this.loggingBroker.LogInformation(
            $"Client disconnected: {Context.ConnectionId}");

        if (exception is not null)
            this.loggingBroker.LogError(exception);

        await base.OnDisconnectedAsync(exception);
    }
}
