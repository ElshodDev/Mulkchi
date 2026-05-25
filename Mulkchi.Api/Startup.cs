using System.Text;
using Mulkchi.Api.Extensions;
using OpenTelemetry;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using OpenTelemetry.Instrumentation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Notifications;
using Mulkchi.Api.Brokers.Tokens;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Hubs;
using Mulkchi.Api.Middleware;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Users;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.HomeRequests;
using Mulkchi.Api.Services.Foundations.Payments;
using Mulkchi.Api.Services.Foundations.Reviews;
using Mulkchi.Api.Services.Foundations.Messages;
using Mulkchi.Api.Services.Foundations.Notifications;
using Mulkchi.Api.Services.Foundations.RentalContracts;
using Mulkchi.Api.Services.Foundations.Favorites;
using Mulkchi.Api.Services.Foundations.SavedSearches;
using Mulkchi.Api.Services.Foundations.PropertyImages;
using Mulkchi.Api.Services.Foundations.PropertyViews;
using Mulkchi.Api.Services.Foundations.AiRecommendations;
using Mulkchi.Api.Services.Foundations.Discounts;
using Mulkchi.Api.Services.Foundations.DiscountUsages;
using Mulkchi.Api.Services.Foundations.Announcements;
using Mulkchi.Api.Services.Foundations.Bookings;
using Mulkchi.Api.Services.Foundations.Boosts;
using Mulkchi.Api.Services.Foundations.Subscriptions;
using Mulkchi.Api.Services.Foundations.Geo;
using Mulkchi.Api.Services.Foundations.Amenities;
using Mulkchi.Api.Services.Foundations.Chat;
using Mulkchi.Api.Services.Foundations.Compare;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.Caching.Distributed;
using Mulkchi.Api.Services.Foundations.AI;
using Mulkchi.Api.Services.Foundations.Analytics;
using Mulkchi.Api.Services.RateLimiting;
using Mulkchi.Api.Validators;
using Mulkchi.Api.Application.Bookings.CreateHold;
using Mulkchi.Api.Application.Bookings.ConfirmPayment;
using Mulkchi.Api.Application.Payments.Webhooks;
using Mulkchi.Api.Services.Background;
using Mulkchi.Api.Services.Search;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.FeatureManagement;
using Hangfire;
using Hangfire.PostgreSql;

namespace Mulkchi.Api;

public class Startup
{
    private readonly IConfiguration configuration;
    private readonly IWebHostEnvironment environment;

    public Startup(IConfiguration configuration, IWebHostEnvironment environment)
    {
        this.configuration = configuration;
        this.environment = environment;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        var redisConnection = Environment.GetEnvironmentVariable("MULKCHI_REDIS_URL") ?? this.configuration["Redis:ConnectionString"];

        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler =
                    System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.DefaultIgnoreCondition =
                    System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
                options.JsonSerializerOptions.PropertyNamingPolicy =
                    System.Text.Json.JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.Converters.Add(
                    new System.Text.Json.Serialization.JsonStringEnumConverter());
            })
            .ConfigureApiBehaviorOptions(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState.Values
                        .SelectMany(state => state.Errors)
                        .Select(error => error.ErrorMessage)
                        .ToArray();

                    bool requestTooLarge =
                        (context.HttpContext.Request.ContentLength.HasValue &&
                         context.HttpContext.Request.ContentLength.Value > 10 * 1024 * 1024)
                        || errors.Any(error =>
                        error.Contains("Request body too large", StringComparison.OrdinalIgnoreCase) ||
                        error.Contains("max request body size", StringComparison.OrdinalIgnoreCase));

                    if (requestTooLarge)
                    {
                        return new ObjectResult(new
                        {
                            error = "File size exceeds the maximum allowed limit of 10MB."
                        })
                        {
                            StatusCode = StatusCodes.Status413RequestEntityTooLarge
                        };
                    }

                    return new BadRequestObjectResult(context.ModelState);
                };
            });
        services.AddEndpointsApiExplorer();
        services.AddHttpContextAccessor(); // Add HttpContextAccessor
        services.AddHttpClient(); // Add IHttpClientFactory
        services.AddHttpClient("OpenStreetMap", client =>
        {
            client.BaseAddress = new Uri("https://overpass-api.de/api/");
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("User-Agent", "Mulkchi Real Estate Platform");
        });

        // In-process response cache for public analytics / search endpoints
        services.AddResponseCaching();
        services.AddMemoryCache();
        services.AddCustomDistributedCache(redisConnection);

        // Add FluentValidation
        services.AddFluentValidationAutoValidation();
        services.AddFluentValidationClientsideAdapters();
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
        services.AddFeatureManagement();
        services.AddCustomOpenTelemetry();

        services.AddSwaggerConfiguration();
        services.AddJwtAuthentication(this.configuration);
        services.AddDatabaseConfiguration(this.configuration);
        services.AddCustomBrokers();
        services.AddCustomFoundationServices(this.configuration);
        services.AddCustomBackgroundServices(this.configuration);
        services.AddDistributedRealtimeInfrastructure(redisConnection, this.environment);

        services.AddSingleton<IUserIdProvider, JwtUserIdProvider>();
        services.AddCorsConfiguration(this.configuration);

        // Add localization
        services.AddLocalization(options => options.ResourcesPath = "Resources");

        // Add health checks
        services.AddHealthChecks()
            .AddDbContextCheck<StorageBroker>(name: "database")
            .AddCheck("file-storage", () => HealthCheckResult.Healthy());
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseStaticFiles(); // Enable static file serving
        app.UseMiddleware<CorrelationIdMiddleware>();
        app.UseMiddleware<RequestLoggingMiddleware>();
        app.UseSecurityHeaders();

        // Add global exception handling
        app.UseGlobalExceptionHandling();

        // Add request localization
        var supportedCultures = new[] { "uz", "ru", "en" };
        app.UseRequestLocalization(new RequestLocalizationOptions
        {
            DefaultRequestCulture = new Microsoft.AspNetCore.Localization.RequestCulture("uz"),
            SupportedCultures = supportedCultures.Select(c => new System.Globalization.CultureInfo(c)).ToList(),
            SupportedUICultures = supportedCultures.Select(c => new System.Globalization.CultureInfo(c)).ToList(),
            RequestCultureProviders = new[]
            {
                new Microsoft.AspNetCore.Localization.AcceptLanguageHeaderRequestCultureProvider()
            }
        });

        // Add Hangfire dashboard (development only)
        if (env.IsDevelopment())
        {
            app.UseHangfireDashboard("/hangfire");
        }

        app.UseRouting();
        app.UseCors(env.IsDevelopment() ? "AllowAngular" : "Production");

        // Add rate limiting middleware AFTER CORS so 429 responses get CORS headers
        app.UseMiddleware<RateLimitMiddleware>();

        app.UseResponseCaching();
        app.UseAuthentication();
        app.UseAuthorization();

        // Add health check endpoints
        app.UseHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = WriteHealthCheckResponse
        });

        app.UseHealthChecks("/health/database", new HealthCheckOptions
        {
            Predicate = (check) => check.Name == "database",
            ResponseWriter = WriteHealthCheckResponse
        });

        app.UseHealthChecks("/health/file-storage", new HealthCheckOptions
        {
            Predicate = (check) => check.Name == "file-storage",
            ResponseWriter = WriteHealthCheckResponse
        });

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
            endpoints.MapHub<ChatHub>("/hubs/chat");
            endpoints.MapHub<NotificationHub>("/hubs/notifications");
        });

        // Schedule recurring Hangfire jobs
        ScheduleRecurringJobs();
    }

    private void ScheduleRecurringJobs()
    {
        // Schedule subscription renewal daily at 2 AM UTC
        RecurringJob.AddOrUpdate<SubscriptionRenewalService>(
            "subscription-renewal",
            x => x.RenewExpiredSubscriptionsAsync(),
            "0 2 * * *", // 2 AM daily
            timeZone: TimeZoneInfo.Utc);

        // Schedule expiration reminders daily at 8 AM UTC
        RecurringJob.AddOrUpdate<SubscriptionRenewalService>(
            "subscription-expiration-reminders",
            x => x.SendExpirationRemindersAsync(),
            "0 8 * * *", // 8 AM daily
            timeZone: TimeZoneInfo.Utc);
    }

    private static Task WriteHealthCheckResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration.TotalMilliseconds,
                data = entry.Value.Data
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };

        return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    }
}
