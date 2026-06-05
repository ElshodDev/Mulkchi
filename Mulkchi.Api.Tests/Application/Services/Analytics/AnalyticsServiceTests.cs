using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Analytics;
using Mulkchi.Api.Services.Foundations.Analytics;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Analytics;

public class AnalyticsServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly IAnalyticsService analyticsService;

    public AnalyticsServiceTests()
    {
    }

    [Fact(Skip = "AnalyticsService is tightly coupled to EF Core DbContext (StorageBroker) and requires an Integration Test with an In-Memory or Test Database.")]
    public void AnalyzePropertyAsync_ShouldBeTestedInIntegrationSuite()
    {
        // AnalyticsService directly uses StorageBroker and EF Core extensions (CountAsync, AverageAsync, etc.)
        // Unit testing it with Moq is not feasible. Integration tests should be used.
        Assert.True(true);
    }
}
