#nullable disable

namespace Mulkchi.Api.Models.Foundations.Messages;

public class Message
{
    public Guid Id { get; set; }
    public string Content { get; set; }
    public MessageType Type { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public Guid SenderId { get; set; }
    public Guid ReceiverId { get; set; }
    public string AttachmentUrl { get; set; }
    public string AttachmentType { get; set; }
    public Guid? PropertyId { get; set; }
    public Guid? HomeRequestId { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
