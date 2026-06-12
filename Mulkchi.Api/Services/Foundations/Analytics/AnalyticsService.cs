using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.AI;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Mulkchi.Api.Services.Foundations.Analytics;


public partial class AnalyticsService : IAnalyticsService
{
    private readonly IStorageBroker storageBroker;

    public AnalyticsService(IStorageBroker storageBroker)
    {
        this.storageBroker = storageBroker;
    }

}

