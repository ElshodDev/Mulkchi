using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Reports;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Notifications;
using Mulkchi.Api.Models.Foundations.Notifications;
using Mulkchi.Api.Services.Foundations.Users;
using Mulkchi.Api.Brokers.Notifications;
using Microsoft.AspNetCore.SignalR;
using Mulkchi.Api.Hubs;

namespace Mulkchi.Api.Services.Foundations.Reports;

public class ReportService : IReportService
{
    private readonly IStorageBroker storageBroker;
    private readonly IPropertyService propertyService;
    private readonly INotificationService notificationService;
    private readonly IUserService userService;
    private readonly IEmailBroker emailBroker;
    private readonly IHubContext<NotificationHub> hubContext;

    public ReportService(
        IStorageBroker storageBroker,
        IPropertyService propertyService,
        INotificationService notificationService,
        IUserService userService,
        IEmailBroker emailBroker,
        IHubContext<NotificationHub> hubContext)
    {
        this.storageBroker = storageBroker;
        this.propertyService = propertyService;
        this.notificationService = notificationService;
        this.userService = userService;
        this.emailBroker = emailBroker;
        this.hubContext = hubContext;
    }

    public async ValueTask<ReportResponse> CreateReportAsync(ReportCreateDto dto, Guid? reporterId = null)
    {
        var now = DateTimeOffset.UtcNow;
        var report = new Report
        {
            Id = Guid.NewGuid(),
            PropertyId = dto.PropertyId,
            ReporterId = reporterId,
            Message = dto.Message,
            Status = ReportStatus.Open,
            CreatedDate = now,
            UpdatedDate = now
        };

        var inserted = await this.storageBroker.InsertReportAsync(report);

        // Try to notify the property owner and admins about the new report
        try
        {
            var prop = await this.propertyService.RetrievePropertyByIdAsync(inserted.PropertyId);
            if (prop != null)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    TitleUz = "Yangi shikoyat",
                    TitleRu = "Новая жалоба",
                    TitleEn = "New report",
                    BodyUz = $"Sizning mulkingiz uchun yangi shikoyat yuborildi: {inserted.Message}",
                    BodyRu = $"На ваше объявление поступила новая жалоба: {inserted.Message}",
                    BodyEn = $"A new report was submitted for your property: {inserted.Message}",
                    Type = NotificationType.SystemAlert,
                    IsRead = false,
                    ActionUrl = $"/host/properties/{inserted.PropertyId}",
                    UserId = prop.HostId
                };

                await this.notificationService.AddNotificationAsync(notification);

                // Notify connected owner via SignalR (if connected)
                try
                {
                    await this.hubContext.Clients.User(prop.HostId.ToString()).SendAsync("ReceiveNotification", new
                    {
                        id = notification.Id.ToString(),
                        title = notification.TitleEn,
                        body = notification.BodyEn,
                        type = notification.Type.ToString()
                    });
                }
                catch { }

                // Send emails and SignalR to admins
                try
                {
                    var admins = await this.userService.RetrieveAllUsersAsync();
                    var adminList = admins.Where(u => u.Role == "Admin" || u.Role == "SuperAdmin").ToList();

                    var subject = "Yangi shikoyat - New report";
                    var body = $"A new report was submitted for property ID {inserted.PropertyId}:\n\n{inserted.Message}";

                    foreach (var admin in adminList)
                    {
                        if (!string.IsNullOrWhiteSpace(admin.Email))
                        {
                            try { await this.emailBroker.SendEmailAsync(admin.Email, subject, body); } catch { }
                        }
                    }

                    var adminIds = adminList.Select(a => a.Id.ToString()).ToList();
                    if (adminIds.Any())
                    {
                        try
                        {
                            await this.hubContext.Clients.Users(adminIds).SendAsync("ReceiveAnnouncement", new
                            {
                                id = Guid.NewGuid().ToString(),
                                title = "New report",
                                body = body
                            });
                        }
                        catch { }
                    }
                }
                catch { }
            }
        }
        catch
        {
            // swallow notification errors to avoid failing report creation
        }

        return new ReportResponse
        {
            Id = inserted.Id,
            PropertyId = inserted.PropertyId,
            ReporterId = inserted.ReporterId,
            Message = inserted.Message,
            Status = inserted.Status,
            CreatedDate = inserted.CreatedDate
        };
    }

    public async ValueTask<(IEnumerable<ReportResponse> Items, int TotalCount)> RetrieveReportsAsync(int page = 1, int pageSize = 20)
    {
        var query = this.storageBroker.SelectAllReports().OrderByDescending(r => r.CreatedDate);
        var total = await Task.FromResult(query.Count());
        var items = query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new ReportResponse
            {
                Id = r.Id,
                PropertyId = r.PropertyId,
                ReporterId = r.ReporterId,
                Message = r.Message,
                Status = r.Status,
                CreatedDate = r.CreatedDate
            })
            .ToList();

        return (items, total);
    }

    public async ValueTask<ReportResponse> UpdateReportStatusAsync(Guid reportId, ReportStatus status)
    {
        var report = await this.storageBroker.SelectReportByIdAsync(reportId);
        if (report == null)
            throw new KeyNotFoundException("Report not found");

        report.Status = status;
        report.UpdatedDate = DateTimeOffset.UtcNow;

        var updated = await this.storageBroker.UpdateReportAsync(report);

        return new ReportResponse
        {
            Id = updated.Id,
            PropertyId = updated.PropertyId,
            ReporterId = updated.ReporterId,
            Message = updated.Message,
            Status = updated.Status,
            CreatedDate = updated.CreatedDate
        };
    }
}
