namespace Mulkchi.Api.Models.Foundations.Outbox;

public class OutboxMessage
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? ProcessedDate { get; set; }
    public int RetryCount { get; set; }
    public string? LastError { get; set; }
}
