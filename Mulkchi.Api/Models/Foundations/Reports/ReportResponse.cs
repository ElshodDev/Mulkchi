namespace Mulkchi.Api.Models.Foundations.Reports;

public class ReportResponse
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public Guid? ReporterId { get; set; }
    public string Message { get; set; }
    public ReportStatus Status { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}
