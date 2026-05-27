namespace Mulkchi.Api.Models.Foundations.Chat;

public class AIChatRequest
{
    public string Message { get; set; }
    public string? SessionId { get; set; }
    public List<Guid>? PropertyIds { get; set; }
}
