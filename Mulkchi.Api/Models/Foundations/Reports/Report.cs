namespace Mulkchi.Api.Models.Foundations.Reports;

public enum ReportStatus
{
    Open = 0,
    Reviewed = 1,
    Closed = 2
}

public class Report
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public Guid? ReporterId { get; set; }
    public string Message { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Open;
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
