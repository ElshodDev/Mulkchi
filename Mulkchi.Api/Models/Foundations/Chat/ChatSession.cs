using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Chat;

public class ChatSession
{
    public string Id { get; set; }
    public Guid? UserId { get; set; }
    public string Title { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? EndedDate { get; set; }
    public bool IsActive { get; set; }

    public virtual User? User { get; set; }
    public virtual ICollection<ChatMessage> Messages { get; set; }
}

public class ChatMessage
{
    public Guid Id { get; set; }
    public string SessionId { get; set; }
    public string SenderType { get; set; }
    public string Content { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public List<Guid>? RelatedPropertyIds { get; set; }
    public string? Intent { get; set; }

    public virtual ChatSession Session { get; set; }
}
