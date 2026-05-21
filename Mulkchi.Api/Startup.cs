using System.Text;
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
using Hangfire.PostgreSQL;

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
        var redisConnection = GetRedisConnectionString();

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
        AddDistributedCache(services, redisConnection);
        
        // Add FluentValidation
        services.AddFluentValidationAutoValidation();
        services.AddFluentValidationClientsideAdapters();
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
        services.AddFeatureManagement();
        AddOpenTelemetry(services);

        AddSwagger(services);
        AddJwtAuthentication(services);
        AddDbContext(services);
        AddBrokers(services);
        AddFoundationServices(services);
        AddBackgroundServices(services);
        AddDistributedRealtimeInfrastructure(services, redisConnection);

        services.AddSingleton<IUserIdProvider, JwtUserIdProvider>();
        AddCors(services);
        
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

    private void AddSwagger(IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Mulkchi API",
                Version = "v1",
                Description = "O'zbekiston ko'chmas mulk platformasi API\n\n" +
                             "Mulkchi Real Estate Platform API for property listings, bookings, analytics, and user management.\n\n" +
                             "**Features:**\n" +
                             "- Property listings with advanced search\n" +
                             "- User authentication with JWT tokens\n" +
                             "- Booking management system\n" +
                             "- Analytics and market insights\n" +
                             "- Multi-language support (Uzbek, Russian, English)\n" +
                             "- Rate limiting and security features",
                Contact = new OpenApiContact
                {
                    Name = "Mulkchi Team",
                    Email = "support@mulkchi.uz",
                    Url = new Uri("https://mulkchi.uz")
                },
                License = new OpenApiLicense
                {
                    Name = "MIT License",
                    Url = new Uri("https://opensource.org/licenses/MIT")
                }
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme.\n\n" +
                             "Enter 'Bearer' [space] and then your token in the text input below.\n\n" +
                             "Example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
    }

    private void AddJwtAuthentication(IServiceCollection services)
    {
        var jwtSecret = Environment.GetEnvironmentVariable("MULKCHI_JWT_SECRET")
            ?? this.configuration["JwtSettings:Secret"];

        if (string.IsNullOrWhiteSpace(jwtSecret))
            throw new InvalidOperationException(
                "JWT Secret is not configured. Set the MULKCHI_JWT_SECRET environment variable or Jwt:Secret in appsettings.");

        var key = Encoding.UTF8.GetBytes(jwtSecret);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = this.configuration["JwtSettings:Issuer"],
                ValidateAudience = true,
                ValidAudience = this.configuration["JwtSettings:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("JwtBearerEvents");

                    var path = context.HttpContext.Request.Path;

                    if (path.StartsWithSegments("/hubs"))
                    {
                        var queryToken = context.Request.Query["access_token"].ToString();
                        if (!string.IsNullOrEmpty(queryToken))
                        {
                            context.Token = queryToken;
                            logger.LogDebug(
                                "JWT token resolved from SignalR query string for {Path}.",
                                path);
                            return Task.CompletedTask;
                        }
                    }

                    if (context.Request.Headers.ContainsKey("Authorization"))
                    {
                        return Task.CompletedTask;
                    }

                    if (context.Request.Cookies.TryGetValue("access_token", out var cookieToken)
                        && !string.IsNullOrEmpty(cookieToken))
                    {
                        context.Token = cookieToken;
                        logger.LogDebug("JWT token resolved from access_token cookie for {Path}.", path);
                    }

                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("JwtBearerEvents");

                    logger.LogWarning(
                        context.Exception,
                        "JWT authentication failed for {Method} {Path}.",
                        context.Request.Method,
                        context.Request.Path);

                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("JwtBearerEvents");

                    logger.LogWarning(
                        "JWT challenge returned for {Method} {Path} with error {Error}.",
                        context.Request.Method,
                        context.Request.Path,
                        context.Error);

                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();
    }

    private void AddBrokers(IServiceCollection services)
    {
        services.AddTransient<ILoggingBroker, LoggingBroker>();
        services.AddTransient<IDateTimeBroker, DateTimeBroker>();
        services.AddTransient<Mulkchi.Api.Brokers.Tokens.ITokenBroker, Mulkchi.Api.Brokers.Tokens.TokenBroker>();
        services.AddSingleton<IFileStorageBroker, LocalFileStorageBroker>();

        // Rate limiting — using DistributedRateLimitService for scale-out support
        // backed by IDistributedCache.
        services.AddSingleton<IRateLimitService, DistributedRateLimitService>();
    }

    private void AddFoundationServices(IServiceCollection services)
    {
        // Telegram
         services.AddSingleton<ITelegramBroker, TelegramBroker>();
        services.AddScoped<ITelegramAuthService, TelegramAuthService>();

         // InMemory cache (Redis yo'q bo'lsa)
         services.AddDistributedMemoryCache();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IUserService, UserService>();
        services.AddSingleton<IUserConnectionTracker, UserConnectionTracker>();
        services.AddSingleton<IRefreshTokenGuard, NoOpRefreshTokenGuard>();
        services.AddScoped<IPropertyService, PropertyService>();
        services.AddScoped<IHomeRequestService, HomeRequestService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IRentalContractService, RentalContractService>();
        services.AddScoped<IFavoriteService, FavoriteService>();
        services.AddScoped<ISavedSearchService, SavedSearchService>();
        services.AddScoped<IPropertyImageService, PropertyImageService>();
        services.AddScoped<IPropertyViewService, PropertyViewService>();
        services.AddScoped<IAiRecommendationService, AiRecommendationService>();
        services.AddScoped<IDiscountService, DiscountService>();
        services.AddScoped<IDiscountUsageService, DiscountUsageService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IBoostService, BoostService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IGeoService, GeoService>();
        services.AddScoped<IAmenityService, AmenityService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<ICompareService, CompareService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IPriceRecommendationService, PriceRecommendationService>();
        


        // Configure EmailSettings
        services.Configure<EmailSettings>(this.configuration.GetSection("EmailSettings"));
        
        // Register email broker
        services.AddTransient<IEmailBroker, SmtpEmailBroker>();
        
        // Register SMS broker (stub — replace with real provider in production)
        services.AddTransient<ISmsBroker, StubSmsBroker>();

        // Vertical-slice handlers (Bookings)
        services.AddScoped<ICreateBookingHoldHandler, CreateBookingHoldHandler>();
        services.AddScoped<IConfirmBookingPaymentHandler, ConfirmBookingPaymentHandler>();
        services.AddScoped<IFinalizePaymentWebhookHandler, FinalizePaymentWebhookHandler>();
        services.AddScoped<IMeiliPropertySearchService, MeiliPropertySearchService>();
    }

    private void AddDistributedCache(IServiceCollection services, string? redisConnection)
    {
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            var configurationOptions = CreateRedisConfigurationOptions(redisConnection);
            services.AddStackExchangeRedisCache(options =>
            {
                options.ConfigurationOptions = configurationOptions;
                options.InstanceName = "mulkchi:";
            });
            return;
        }

        services.AddDistributedMemoryCache();
    }

    private void AddDistributedRealtimeInfrastructure(IServiceCollection services, string? redisConnection)
    {
        var signalRBuilder = services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = this.environment.IsDevelopment();
            options.MaximumReceiveMessageSize = 128 * 1024; // Increased for larger payloads
            options.StreamBufferCapacity = 10;
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(120);
            options.KeepAliveInterval = TimeSpan.FromSeconds(15); // More frequent pings
            options.HandshakeTimeout = TimeSpan.FromSeconds(30);
        });

        if (string.IsNullOrWhiteSpace(redisConnection))
        {
            // In-memory connection tracker for local development
            services.AddSingleton<IUserConnectionTracker, UserConnectionTracker>();
            return;
        }

        services.AddHostedService<RedisPresenceCleanupService>();

        var configurationOptions = CreateRedisConfigurationOptions(redisConnection);

        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(configurationOptions));
        services.AddSingleton<IUserConnectionTracker, RedisUserConnectionTracker>();
        services.AddSingleton<IRefreshTokenGuard, RedisRefreshTokenGuard>();

        signalRBuilder.AddStackExchangeRedis(redisConnection, options =>
        {
            options.Configuration.ChannelPrefix = "mulkchi:signalr";
        });
    }

    private void AddBackgroundServices(IServiceCollection services)
    {
        services.AddHostedService<ExpiredBookingHoldCleanupService>();
        services.AddHostedService<OutboxProcessorService>();
        services.AddHostedService<AnalyticsCollectionService>();

        // Add Hangfire for subscription auto-renewal
        var connectionString = this.configuration.GetConnectionString("DefaultConnection");
        services.AddHangfire(config => config
            .UsePostgreSQLStorage(connectionString)
            .WithJobExpirationTimeout(TimeSpan.FromDays(7)));

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 2; // Use 2 background workers
            options.Queues = new[] { "default", "subscriptions" };
            options.ServerTimeout = TimeSpan.FromMinutes(5);
            options.ShutdownTimeout = TimeSpan.FromSeconds(30);
        });

        // Register subscription renewal service for Hangfire
        services.AddScoped<SubscriptionRenewalService>();
    }

    private string? GetRedisConnectionString() =>
        Environment.GetEnvironmentVariable("MULKCHI_REDIS_URL")
        ?? this.configuration["Redis:ConnectionString"];

    private static ConfigurationOptions CreateRedisConfigurationOptions(string redisConnection)
    {
        var configurationOptions = ConfigurationOptions.Parse(redisConnection);
        configurationOptions.AbortOnConnectFail = false;
        configurationOptions.ConnectRetry = 3;
        configurationOptions.ConnectTimeout = 5000;
        return configurationOptions;
    }

    private void AddOpenTelemetry(IServiceCollection services)
    {
        services.AddOpenTelemetry()
            .ConfigureResource(resource =>
            {
                resource.AddService("Mulkchi.Api");
            })
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddEntityFrameworkCoreInstrumentation()
                    .AddOtlpExporter();
            });
    }

    private void AddDbContext(IServiceCollection services)
    {
        var connectionString = Environment.GetEnvironmentVariable("MULKCHI_CONNECTION_STRING")
            ?? this.configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<StorageBroker>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IStorageBroker, StorageBroker>();
    }

    private void AddCors(IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAngular", policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:4200",
                        "http://127.0.0.1:4200",
                        "http://localhost:3000"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });

            var allowedOrigins = this.configuration
                .GetSection("AllowedOrigins")
                .Get<string[]>();

            options.AddPolicy("Production", builder =>
            {
                if (allowedOrigins is { Length: > 0 })
                {
                    builder
                        .WithOrigins(allowedOrigins)
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                }
                else
                {
                    builder
                        .WithOrigins(Array.Empty<string>())
                        .AllowAnyMethod()
                        .AllowAnyHeader();
                }
            });
        });
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
