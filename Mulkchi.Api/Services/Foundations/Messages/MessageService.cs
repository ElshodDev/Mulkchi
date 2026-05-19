using Mulkchi.Api.Models.Foundations.Messages;
using Mulkchi.Api.Models.Foundations.Messages.Exceptions;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Services.Foundations.Messages;

public partial class MessageService : IMessageService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ICurrentUserService currentUserService;

    public MessageService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ICurrentUserService currentUserService)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.currentUserService = currentUserService;
    }

    public ValueTask<Message> AddMessageAsync(Message message) =>
        TryCatch(async () =>
        {
            ValidateMessageOnAdd(message);
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            message.CreatedDate = now;
            message.UpdatedDate = now;
            return await this.storageBroker.InsertMessageAsync(message);
        });

    public IQueryable<Message> RetrieveAllMessages() =>
        TryCatch(() => this.storageBroker.SelectAllMessages());

    public ValueTask<Message> RetrieveMessageByIdAsync(Guid messageId) =>
        TryCatch(async () =>
        {
            ValidateMessageId(messageId);
            Message maybeMessage = await this.storageBroker.SelectMessageByIdAsync(messageId);

            if (maybeMessage is null)
                throw new NotFoundMessageException(messageId);
            
            // Check authorization: only sender or receiver can access
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && 
                maybeMessage.SenderId != currentUserId.Value && maybeMessage.ReceiverId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only access your own messages.");
            }

            return maybeMessage;
        });

    public ValueTask<Message> ModifyMessageAsync(Message message) =>
        TryCatch(async () =>
        {
            ValidateMessageOnModify(message);
            
            // Get existing message to check ownership
            Message existingMessage = await this.storageBroker.SelectMessageByIdAsync(message.Id);
            if (existingMessage == null)
                throw new NotFoundMessageException(message.Id);
            
            // Check authorization: only sender can modify
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && existingMessage.SenderId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only modify your own messages.");
            }
            
            message.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            return await this.storageBroker.UpdateMessageAsync(message);
        });

    public ValueTask<Message> RemoveMessageByIdAsync(Guid messageId) =>
        TryCatch(async () =>
        {
            ValidateMessageId(messageId);
            
            // Get existing message to check ownership
            Message existingMessage = await this.storageBroker.SelectMessageByIdAsync(messageId);
            if (existingMessage == null)
                throw new NotFoundMessageException(messageId);
            
            // Check authorization: only sender can delete
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && existingMessage.SenderId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only delete your own messages.");
            }
            
            return await this.storageBroker.DeleteMessageByIdAsync(messageId);
        });
}
