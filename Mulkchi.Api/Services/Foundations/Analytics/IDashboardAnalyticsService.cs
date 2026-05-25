using System;
using System.Threading.Tasks;

namespace Mulkchi.Api.Services.Foundations.Analytics;

public interface IDashboardAnalyticsService
{
    Task<object> GetDashboardAsync(DateTimeOffset? startDate, DateTimeOffset? endDate);
}
