using System;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Mulkchi.Api.Brokers.Storages;

namespace Mulkchi.Api.Tests.Integration.Setup;

public class CustomWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup> where TStartup : class
{
    public CustomWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("MULKCHI_JWT_SECRET", "super_secret_key_for_testing_only_which_is_long_enough");
        Environment.SetEnvironmentVariable("MULKCHI_TELEGRAM_TOKEN", "dummy_telegram_token_for_testing:12345");
        Environment.SetEnvironmentVariable("USE_IN_MEMORY_DB", "true");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove background hosted services (Hangfire, Telegram bot) to prevent hanging
            var hostedServices = services.Where(s => s.ServiceType == typeof(Microsoft.Extensions.Hosting.IHostedService)).ToList();
            foreach (var hs in hostedServices)
            {
                services.Remove(hs);
            }

            // Mock Hangfire IRecurringJobManager so Startup.Configure doesn't fail
            services.AddSingleton(new Moq.Mock<Hangfire.IRecurringJobManager>().Object);

            // We just need to register InMemory since UseNpgsql was skipped
            services.AddDbContext<StorageBroker>(options =>
            {
                options.UseInMemoryDatabase("InMemoryDbForTesting");
            });

            var sp = services.BuildServiceProvider();

            using (var scope = sp.CreateScope())
            {
                var scopedServices = scope.ServiceProvider;
                var db = scopedServices.GetRequiredService<StorageBroker>();
                var logger = scopedServices.GetRequiredService<ILogger<CustomWebApplicationFactory<TStartup>>>();

                db.Database.EnsureCreated();
            }
        });
    }
}
