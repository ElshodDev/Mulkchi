using Mulkchi.Api.Models.Foundations.Reports;

namespace Mulkchi.Api.Services.Foundations.Reports;

public interface IReportService
{
    ValueTask<ReportResponse> CreateReportAsync(ReportCreateDto dto, Guid? reporterId = null);
    ValueTask<(IEnumerable<ReportResponse> Items, int TotalCount)> RetrieveReportsAsync(int page = 1, int pageSize = 20);
    ValueTask<ReportResponse> UpdateReportStatusAsync(Guid reportId, ReportStatus status);
}
