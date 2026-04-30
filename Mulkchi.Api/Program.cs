using Serilog;
using Mulkchi.Api.DataSeed;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;

namespace Mulkchi.Api;

public partial class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Configure URLs - listen on all interfaces for development
        // This ensures the backend is accessible from Angular frontend
        builder.WebHost.UseUrls("http://0.0.0.0:5000");

        // Add User Secrets and Environment Variables explicitly to override appsettings
        builder.Configuration
            .AddUserSecrets<Program>(optional: true)
            .AddEnvironmentVariables();

        // Configure Serilog with URL logging suppression for security
        // Tokenlar URL'da ko'rinmasligi uchun
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "Mulkchi.Api")
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.File("logs/mulkchi-.txt", 
                rollingInterval: RollingInterval.Day,
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger();

        builder.Host.UseSerilog();

        // Configure lowercase routes for consistent API URLs
        builder.Services.Configure<RouteOptions>(options =>
        {
            options.LowercaseUrls = true;
        });

        var startup = new Startup(builder.Configuration, builder.Environment);
        startup.ConfigureServices(builder.Services);
        var app = builder.Build();
        startup.Configure(app, app.Environment);

        // Apply pending migrations at startup so the database exists before seed runs.
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<StorageBroker>();
            await db.Database.MigrateAsync();
        }

        // Seed development data
        await DevelopmentDataSeeder.SeedAsync(app);

        app.Run();
    }
}
