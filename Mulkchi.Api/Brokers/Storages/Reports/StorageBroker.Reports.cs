using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Reports;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<Report> Reports { get; set; }

    public async ValueTask<Report> InsertReportAsync(Report report)
    {
        var entry = await this.Reports.AddAsync(report);
        await this.SaveChangesAsync();
        return entry.Entity;
    }

    public IQueryable<Report> SelectAllReports()
        => this.Reports.AsQueryable();

    public async ValueTask<Report> SelectReportByIdAsync(Guid reportId)
        => (await this.Reports.FindAsync(reportId))!;

    public async ValueTask<Report> UpdateReportAsync(Report report)
    {
        var entry = this.Reports.Update(report);
        await this.SaveChangesAsync();
        return entry.Entity;
    }
}
