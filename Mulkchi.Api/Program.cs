using Serilog;
using Serilog.Events;
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
        // BMI: Backend barcha interfeyslarda (IPv4 va IPv6) port 5000 da eshitadi
        builder.WebHost.UseUrls("http://0.0.0.0:5000");

        // Add User Secrets and Environment Variables explicitly to override appsettings
        builder.Configuration
            .AddUserSecrets<Program>(optional: true)
            .AddEnvironmentVariables();

        // Configure Serilog with URL logging suppression for security
        // BMI: Tokenlar URL'da ko'rinmasligi uchun - OWASP Sensitive Data Exposure protection
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "Mulkchi.Api")
            // URL logging ni o'chirish - xavfsizlik uchun (JWT tokenlar query string'da bo'lishi mumkin)
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}",
                restrictedToMinimumLevel: LogEventLevel.Information)
            .WriteTo.File("logs/mulkchi-.txt", 
                rollingInterval: RollingInterval.Day,
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}",
                restrictedToMinimumLevel: LogEventLevel.Debug)
            // Query string va URL ni logga yozmaslik uchun filtr
            .Destructure.With(new SecurityDestructuringPolicy())
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

/// <summary>
/// Security destructuring policy to prevent sensitive data logging
/// BMI: OWASP Sensitive Data Exposure protection
/// </summary>
public class SecurityDestructuringPolicy : Serilog.Core.IDestructuringPolicy
{
    public bool TryDestructure(object value, Serilog.Core.ILogEventPropertyValueFactory propertyValueFactory, out Serilog.Core.LogEventPropertyValue? result)
    {
        // Prevent logging of HttpContext.Request.Query (may contain JWT tokens)
        if (value is Microsoft.AspNetCore.Http.HttpRequest request)
        {
            result = new Serilog.Events.StructureValue(new[]
            {
                new Serilog.Events.LogEventProperty("Method", new ScalarValue(request.Method)),
                new Serilog.Events.LogEventProperty("Path", new ScalarValue(request.Path)),
                // QueryString intentionally omitted to prevent JWT token logging
                new Serilog.Events.LogEventProperty("ContentType", new ScalarValue(request.ContentType ?? "unknown"))
            });
            return true;
        }

        result = null;
        return false;
    }
}
