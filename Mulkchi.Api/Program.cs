using Serilog;
using Serilog.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Features;
using Mulkchi.Api.Brokers.Storages;
using Hangfire;

namespace Mulkchi.Api;

public partial class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.WebHost.UseUrls("http://0.0.0.0:5000");

        builder.Configuration
            .AddUserSecrets<Program>(optional: true)
            .AddEnvironmentVariables();

        var jwtSecret = builder.Configuration["MULKCHI_JWT_SECRET"]
            ?? builder.Configuration["JwtSettings:Secret"];
        var dbPassword = builder.Configuration["MULKCHI_DB_PASSWORD"];
        var connectionString = builder.Configuration["MULKCHI_DB_CONNECTION_STRING"]
            ?? builder.Configuration.GetConnectionString("DefaultConnection");

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
        }

        if (!string.IsNullOrWhiteSpace(jwtSecret))
        {
            builder.Configuration["JwtSettings:Secret"] = jwtSecret;
        }

        if (!string.IsNullOrWhiteSpace(dbPassword))
        {
            builder.Configuration["MULKCHI_DB_PASSWORD"] = dbPassword;
        }

        if (string.IsNullOrEmpty(jwtSecret) || jwtSecret == "SET_IN_ENVIRONMENT")
        {
            throw new InvalidOperationException("JWT Secret not configured. Set MULKCHI_JWT_SECRET environment variable or configure JwtSettings:Secret in appsettings.");
        }

        if (!string.IsNullOrEmpty(dbPassword) && connectionString != null && connectionString.Contains("SET_IN_ENVIRONMENT"))
        {
            connectionString = connectionString.Replace("SET_IN_ENVIRONMENT", dbPassword);
            builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
        }

        // Convert postgres:// URI to ADO.NET Connection String
        if (!string.IsNullOrWhiteSpace(connectionString) && (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://")))
        {
            var uri = new Uri(connectionString);
            var userInfo = uri.UserInfo.Split(new[] { ':' }, 2);
            var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var dbName = uri.AbsolutePath.TrimStart('/');
            var port = uri.Port > 0 ? uri.Port : 5432;
            connectionString = $"Host={uri.Host};Port={port};Database={dbName};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
            builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
            builder.Configuration["MULKCHI_DB_CONNECTION_STRING"] = connectionString;
        }

        builder.Services.Configure<FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = 10 * 1024 * 1024;
        });

        builder.WebHost.ConfigureKestrel(options =>
        {
            options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
        });

        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "Mulkchi.Api")
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}",
                restrictedToMinimumLevel: LogEventLevel.Information)
            .WriteTo.File("logs/mulkchi-.txt",
                rollingInterval: RollingInterval.Day,
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}",
                restrictedToMinimumLevel: LogEventLevel.Debug)
            .Destructure.With(new SecurityDestructuringPolicy())
            .CreateLogger();

        builder.Host.UseSerilog();

        builder.Services.Configure<RouteOptions>(options =>
        {
            options.LowercaseUrls = true;
        });

        var startup = new Startup(builder.Configuration, builder.Environment);
        startup.ConfigureServices(builder.Services);

        var app = builder.Build();

        app.Use(async (context, next) =>
        {
            try
            {
                await next(context);
            }
            catch (BadHttpRequestException ex)
                when (ex.StatusCode == StatusCodes.Status413RequestEntityTooLarge)
            {
                if (context.Response.HasStarted)
                {
                    throw;
                }

                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status413RequestEntityTooLarge;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "File size exceeds the maximum allowed limit of 10MB."
                });
            }
        });

        var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
        startup.Configure(app, app.Environment, recurringJobManager);

        var runMigrations = builder.Configuration
            .GetValue<bool>("RunMigrationsOnStartup", false);

        if (runMigrations)
        {
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<StorageBroker>();
                await db.Database.MigrateAsync();
            }
        }

        var randomizeMockLocations = builder.Configuration
            .GetValue<bool>("Seed:RandomizeMockLocations", false);

        if (app.Environment.IsDevelopment() && randomizeMockLocations)
        {
            // Optional one-time dev seed helper: randomize existing mock properties locations
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<StorageBroker>();
                var allProps = await db.Properties.ToListAsync();
                var random = new Random();
                foreach (var p in allProps)
                {
                    if (p.City == "Toshkent sh." || p.City == "Toshkent")
                    {
                        p.Latitude = 41.311081 + (random.NextDouble() - 0.5) * 0.15;
                        p.Longitude = 69.240562 + (random.NextDouble() - 0.5) * 0.15;
                    }
                    
                    // Fix astronomical prices bug
                    if (p.SalePrice > 10000000m) p.SalePrice = (p.SalePrice % 10000000m) / 10000m + 50000m;
                    if (p.MonthlyRent > 100000m) p.MonthlyRent = (p.MonthlyRent % 100000m) / 1000m + 300m;
                    if (p.PricePerNight > 10000m) p.PricePerNight = (p.PricePerNight % 10000m) / 1000m + 30m;
                }
                await db.SaveChangesAsync();
            }
        }

        app.Run();
    }
}

public class SecurityDestructuringPolicy : Serilog.Core.IDestructuringPolicy
{
    public bool TryDestructure(object value, Serilog.Core.ILogEventPropertyValueFactory propertyValueFactory, out Serilog.Events.LogEventPropertyValue result)
    {
        if (value is Microsoft.AspNetCore.Http.HttpRequest request)
        {
            result = new Serilog.Events.StructureValue(new[]
            {
                new Serilog.Events.LogEventProperty("Method", new Serilog.Events.ScalarValue(request.Method)),
                new Serilog.Events.LogEventProperty("Path", new Serilog.Events.ScalarValue(request.Path)),
                new Serilog.Events.LogEventProperty("ContentType", new Serilog.Events.ScalarValue(request.ContentType ?? "unknown"))
            });
            return true;
        }

        result = new Serilog.Events.ScalarValue(null);
        return false;
    }
}
