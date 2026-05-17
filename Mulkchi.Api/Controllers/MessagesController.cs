using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Hubs;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Messages;
using Mulkchi.Api.Models.Foundations.Messages.Exceptions;
using Mulkchi.Api.Services.Foundations.Messages;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly IMessageService messageService;
    private readonly IHubContext<ChatHub> chatHub;
    private readonly IFileStorageBroker fileStorageBroker;
    private readonly IStorageBroker storageBroker;

    public MessagesController(
        IMessageService messageService,
        IHubContext<ChatHub> chatHub,
        IFileStorageBroker fileStorageBroker,
        IStorageBroker storageBroker)
    {
        this.messageService = messageService;
        this.chatHub = chatHub;
        this.fileStorageBroker = fileStorageBroker;
        this.storageBroker = storageBroker;
    }

    [HttpPost("upload-attachment")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async ValueTask<ActionResult> UploadAttachmentAsync(IFormFile file)
    {
        try
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            string fileUrl = await this.fileStorageBroker.UploadFileAsync(file, "chat-attachments");

            return Ok(new
            {
                fileUrl,
                fileName = file.FileName,
                fileSize = file.Length,
                contentType = file.ContentType
            });
        }
        catch (ArgumentException argumentException)
        {
            return BadRequest(new { message = argumentException.Message });
        }
    }

    [HttpPost]
    [Authorize]
    public async ValueTask<ActionResult<Message>> PostMessageAsync(Message message)
    {
        try
        {
            Message addedMessage = await this.messageService.AddMessageAsync(message);
            
            // Broadcast message via ChatHub
            await this.chatHub.Clients.User(message.ReceiverId.ToString())
                .SendAsync("ReceiveMessage", new
                {
                    addedMessage.Id,
                    addedMessage.SenderId,
                    addedMessage.ReceiverId,
                    addedMessage.Content,
                    addedMessage.Type,
                    addedMessage.IsRead,
                    addedMessage.CreatedDate,
                    Timestamp = DateTime.UtcNow
                });
            
            return Created("message", addedMessage);
        }
        catch (MessageValidationException messageValidationException)
        {
            return BadRequest(new { message = messageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyValidationException messageDependencyValidationException)
        {
            return BadRequest(new { message = messageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (MessageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet]
    [Authorize]
    public ActionResult<PagedResult<Message>> GetAllMessages([FromQuery] PaginationParams pagination)
    {
        try
        {
            IQueryable<Message> query = this.messageService.RetrieveAllMessages();
            int totalCount = query.Count();

            var items = query
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToList();

            var result = new PagedResult<Message>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            };

            return Ok(result);
        }
        catch (MessageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (MessageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpGet("conversations")]
    [Authorize]
    public ActionResult<IEnumerable<object>> GetConversations()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            var users = this.storageBroker.SelectAllUsers().ToList();
            var properties = this.storageBroker.SelectAllProperties().ToList();

            var conversations = this.messageService
                .RetrieveAllMessages()
                .Where(message => message.SenderId == currentUserId || message.ReceiverId == currentUserId)
                .ToList()
                .GroupBy(message => new 
                { 
                    OtherUserId = message.SenderId == currentUserId ? message.ReceiverId : message.SenderId,
                    PropertyId = message.PropertyId 
                })
                .Select(group =>
                {
                    Message latestMessage = group.OrderByDescending(message => message.CreatedDate).First();
                    var otherUser = users.FirstOrDefault(user => user.Id == group.Key.OtherUserId);
                    var property = group.Key.PropertyId.HasValue 
                        ? properties.FirstOrDefault(p => p.Id == group.Key.PropertyId.Value)
                        : null;

                    return new
                    {
                        otherUserId = group.Key.OtherUserId,
                        propertyId = group.Key.PropertyId,
                        propertyTitle = property?.Title,
                        propertyImage = property?.Images?.FirstOrDefault(i => i.IsPrimary)?.Url 
                                        ?? property?.Images?.FirstOrDefault()?.Url,
                        otherUserName = otherUser is null
                            ? "Foydalanuvchi"
                            : $"{otherUser.FirstName} {otherUser.LastName}".Trim(),
                        otherUserAvatar = otherUser?.AvatarUrl,
                        lastMessage = latestMessage.Content,
                        lastMessageDate = latestMessage.CreatedDate,
                        unreadCount = group.Count(message => message.ReceiverId == currentUserId && !message.IsRead)
                    };
                })
                .OrderByDescending(conversation => conversation.lastMessageDate)
                .ToList();

            return Ok(conversations);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("conversation/{otherUserId}")]
    [Authorize]
    public ActionResult<IEnumerable<object>> GetConversationMessages(Guid otherUserId, [FromQuery] Guid? propertyId = null)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized();

            var users = this.storageBroker.SelectAllUsers().ToList();

            var messages = this.messageService
                .RetrieveAllMessages()
                .Where(message =>
                    ((message.SenderId == currentUserId && message.ReceiverId == otherUserId) ||
                    (message.SenderId == otherUserId && message.ReceiverId == currentUserId)) &&
                    message.PropertyId == propertyId)
                .OrderBy(message => message.CreatedDate)
                .ToList()
                .Select(message =>
                {
                    var sender = users.FirstOrDefault(user => user.Id == message.SenderId);

                    return new
                    {
                        id = message.Id,
                        senderId = message.SenderId,
                        receiverId = message.ReceiverId,
                        propertyId = message.PropertyId,
                        content = message.Content,
                        type = message.Type,
                        isRead = message.IsRead,
                        readAt = message.ReadAt,
                        createdDate = message.CreatedDate,
                        updatedDate = message.UpdatedDate,
                        senderName = sender is null
                            ? "Foydalanuvchi"
                            : $"{sender.FirstName} {sender.LastName}".Trim(),
                        senderAvatar = sender?.AvatarUrl
                    };
                })
                .ToList();

            return Ok(messages);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<Message>> GetMessageByIdAsync(Guid id)
    {
        try
        {
            Message message = await this.messageService.RetrieveMessageByIdAsync(id);
            return Ok(message);
        }
        catch (MessageValidationException messageValidationException)
        {
            return BadRequest(new { message = messageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyValidationException messageDependencyValidationException)
            when (messageDependencyValidationException.InnerException is NotFoundMessageException)
        {
            return NotFound(new { message = messageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyValidationException messageDependencyValidationException)
        {
            return BadRequest(new { message = messageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (MessageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpPut]
    [Authorize]
    public async ValueTask<ActionResult<Message>> PutMessageAsync(Message message)
    {
        try
        {
            Message modifiedMessage = await this.messageService.ModifyMessageAsync(message);
            return Ok(modifiedMessage);
        }
        catch (MessageValidationException messageValidationException)
        {
            return BadRequest(new { message = messageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyValidationException messageDependencyValidationException)
            when (messageDependencyValidationException.InnerException is NotFoundMessageException)
        {
            return NotFound(new { message = messageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyValidationException messageDependencyValidationException)
        {
            return BadRequest(new { message = messageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (MessageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async ValueTask<ActionResult<Message>> DeleteMessageByIdAsync(Guid id)
    {
        try
        {
            Message deletedMessage = await this.messageService.RemoveMessageByIdAsync(id);
            return Ok(deletedMessage);
        }
        catch (MessageValidationException messageValidationException)
        {
            return BadRequest(new { message = messageValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyValidationException messageDependencyValidationException)
            when (messageDependencyValidationException.InnerException is NotFoundMessageException)
        {
            return NotFound(new { message = messageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyValidationException messageDependencyValidationException)
        {
            return BadRequest(new { message = messageDependencyValidationException.InnerException?.Message ?? "An error occurred." });
        }
        catch (MessageDependencyException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
        catch (MessageServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Internal server error." });
        }
    }

    // Read status endpoints
    [HttpPut("{id:guid}/read")]
    [Authorize]
    public async ValueTask<ActionResult> MarkAsReadAsync(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var message = await this.storageBroker.SelectMessageByIdAsync(id);
            if (message is null)
                return NotFound(new { message = "Message not found." });

            // Only receiver can mark as read
            if (message.ReceiverId != userId)
                return Forbid();

            if (!message.IsRead)
            {
                message.IsRead = true;
                message.ReadAt = DateTimeOffset.UtcNow;
                message.UpdatedDate = DateTimeOffset.UtcNow;
                await this.storageBroker.UpdateMessageAsync(message);
            }

            return Ok(new { isRead = true, readAt = message.ReadAt });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("conversations/{userId:guid}/read-all")]
    [Authorize]
    public async ValueTask<ActionResult> MarkConversationAsReadAsync(Guid userId, [FromQuery] Guid? propertyId = null)
    {
        try
        {
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserIdClaim is null || !Guid.TryParse(currentUserIdClaim, out Guid currentUserId))
                return Unauthorized();

            var messages = await this.storageBroker.SelectAllMessages()
                .Where(m => ((m.SenderId == userId && m.ReceiverId == currentUserId) ||
                            (m.SenderId == currentUserId && m.ReceiverId == userId)) &&
                            !m.IsRead && m.ReceiverId == currentUserId &&
                            m.PropertyId == propertyId)
                .ToListAsync();

            int markedCount = 0;
            var now = DateTimeOffset.UtcNow;
            foreach (var message in messages)
            {
                message.IsRead = true;
                message.ReadAt = now;
                message.UpdatedDate = now;
                await this.storageBroker.UpdateMessageAsync(message);
                markedCount++;
            }

            return Ok(new { markedCount, message = $"{markedCount} messages marked as read." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("unread/count")]
    [Authorize]
    public async ValueTask<ActionResult> GetUnreadCountAsync()
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim is null || !Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            var unreadCount = await this.storageBroker.SelectAllMessages()
                .CountAsync(m => m.ReceiverId == userId && !m.IsRead && m.DeletedDate == null);

            var conversations = await this.storageBroker.SelectAllMessages()
                .Where(m => m.ReceiverId == userId && !m.IsRead && m.DeletedDate == null)
                .GroupBy(m => m.SenderId)
                .Select(g => new { senderId = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                totalUnread = unreadCount,
                conversations = conversations
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("conversations/{userId:guid}/unread")]
    [Authorize]
    public async ValueTask<ActionResult> GetUnreadCountForConversationAsync(Guid userId)
    {
        try
        {
            var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserIdClaim is null || !Guid.TryParse(currentUserIdClaim, out Guid currentUserId))
                return Unauthorized();

            var unreadCount = await this.storageBroker.SelectAllMessages()
                .CountAsync(m => m.SenderId == userId &&
                                 m.ReceiverId == currentUserId &&
                                 !m.IsRead &&
                                 m.DeletedDate == null);

            return Ok(new { senderId = userId, unreadCount });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
