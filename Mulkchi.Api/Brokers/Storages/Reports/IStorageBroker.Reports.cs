using Mulkchi.Api.Models.Foundations.Reports;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<Report> InsertReportAsync(Report report);
    IQueryable<Report> SelectAllReports();
    ValueTask<Report> SelectReportByIdAsync(Guid reportId);
    ValueTask<Report> UpdateReportAsync(Report report);
}
