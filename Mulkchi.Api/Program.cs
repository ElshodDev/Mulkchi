using Serilog;
using Serilog.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Features;
using Mulkchi.Api.DataSeed;
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

        // Validate critical configuration values
        var jwtSecret = builder.Configuration["MULKCHI_JWT_SECRET"]
            ?? builder.Configuration["JwtSettings:Secret"];
        var telegramToken = builder.Configuration["MULKCHI_TELEGRAM_TOKEN"]
            ?? builder.Configuration["TelegramAuth:BotToken"];
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

        if (!string.IsNullOrWhiteSpace(telegramToken))
        {
            builder.Configuration["TelegramAuth:BotToken"] = telegramToken;
        }

        if (!string.IsNullOrWhiteSpace(dbPassword))
        {
            builder.Configuration["MULKCHI_DB_PASSWORD"] = dbPassword;
        }

        if (string.IsNullOrEmpty(jwtSecret) || jwtSecret == "SET_IN_ENVIRONMENT")
        {
            throw new InvalidOperationException("JWT Secret not configured. Set MULKCHI_JWT_SECRET environment variable or configure JwtSettings:Secret in appsettings.");
        }

        if (string.IsNullOrEmpty(telegramToken) || telegramToken == "SET_IN_ENVIRONMENT")
        {
            throw new InvalidOperationException("Telegram Bot Token not configured. Set MULKCHI_TELEGRAM_TOKEN environment variable or configure TelegramAuth:BotToken in appsettings.");
        }

        if (!string.IsNullOrEmpty(dbPassword) && connectionString != null && connectionString.Contains("SET_IN_ENVIRONMENT"))
        {
            // Replace placeholder in connection string if environment variable is provided
            connectionString = connectionString.Replace("SET_IN_ENVIRONMENT", dbPassword);
            builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
        }

        builder.Services.Configure<FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = 10 * 1024 * 1024;
        });

        builder.WebHost.ConfigureKestrel(options =>
        {
            options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
        });

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

        startup.Configure(app, app.Environment);

        // Conditionally apply pending migrations based on configuration
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

        if (app.Environment.IsDevelopment())
        {
            await DevelopmentDataSeeder.SeedAsync(app);
        }

        app.Run();
    }
}

/// <summary>
/// Security destructuring policy to prevent sensitive data logging
/// BMI: OWASP Sensitive Data Exposure protection
/// </summary>
public class SecurityDestructuringPolicy : Serilog.Core.IDestructuringPolicy
{
    public bool TryDestructure(object value, Serilog.Core.ILogEventPropertyValueFactory propertyValueFactory, out Serilog.Events.LogEventPropertyValue result)
    {
        // Prevent logging of HttpContext.Request.Query (may contain JWT tokens)
        if (value is Microsoft.AspNetCore.Http.HttpRequest request)
        {
            result = new Serilog.Events.StructureValue(new[]
            {
                new Serilog.Events.LogEventProperty("Method", new Serilog.Events.ScalarValue(request.Method)),
                new Serilog.Events.LogEventProperty("Path", new Serilog.Events.ScalarValue(request.Path)),
                // QueryString intentionally omitted to prevent JWT token logging
                new Serilog.Events.LogEventProperty("ContentType", new Serilog.Events.ScalarValue(request.ContentType ?? "unknown"))
            });
            return true;
        }

        result = new Serilog.Events.ScalarValue(null);
        return false;
    }
}
