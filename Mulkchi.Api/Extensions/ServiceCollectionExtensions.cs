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
using Mulkchi.Api.Services.Foundations.AI;
using Mulkchi.Api.Services.Foundations.Analytics;
using Mulkchi.Api.Services.RateLimiting;
using Mulkchi.Api.Application.Bookings.CreateHold;
using Mulkchi.Api.Application.Bookings.ConfirmPayment;
using Mulkchi.Api.Application.Payments.Webhooks;
using Mulkchi.Api.Services.Background;
using Mulkchi.Api.Services.Search;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSwaggerConfiguration(this IServiceCollection services)
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

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSecret = Environment.GetEnvironmentVariable("MULKCHI_JWT_SECRET")
            ?? configuration["JwtSettings:Secret"];

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
                ValidIssuer = configuration["JwtSettings:Issuer"],
                ValidateAudience = true,
                ValidAudience = configuration["JwtSettings:Audience"],
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
        return services;
    }

    public static IServiceCollection AddCustomBrokers(this IServiceCollection services)
    {
        services.AddTransient<ILoggingBroker, LoggingBroker>();
        services.AddTransient<IDateTimeBroker, DateTimeBroker>();
        services.AddTransient<Mulkchi.Api.Brokers.Tokens.ITokenBroker, Mulkchi.Api.Brokers.Tokens.TokenBroker>();
        services.AddSingleton<IFileStorageBroker, LocalFileStorageBroker>();
        services.AddTransient<Mulkchi.Api.Brokers.Payments.IPaymeBroker, Mulkchi.Api.Brokers.Payments.PaymeBroker>();
        services.AddTransient<Mulkchi.Api.Brokers.Payments.IClickBroker, Mulkchi.Api.Brokers.Payments.ClickBroker>();

        services.AddSingleton<IRateLimitService, DistributedRateLimitService>();
        return services;
    }

    public static IServiceCollection AddCustomFoundationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ITelegramBroker, TelegramBroker>();
        services.AddScoped<ITelegramAuthService, TelegramAuthService>();

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
        services.AddScoped<IDashboardAnalyticsService, DashboardAnalyticsService>();
        services.AddScoped<IPriceRecommendationService, PriceRecommendationService>();
        services.AddScoped<ISemanticSearchService, SemanticSearchService>();

        services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));

        services.AddTransient<IEmailBroker, SmtpEmailBroker>();

        services.AddTransient<ISmsBroker, StubSmsBroker>();

        services.AddScoped<ICreateBookingHoldHandler, CreateBookingHoldHandler>();
        services.AddScoped<IConfirmBookingPaymentHandler, ConfirmBookingPaymentHandler>();
        services.AddScoped<IFinalizePaymentWebhookHandler, FinalizePaymentWebhookHandler>();
        services.AddScoped<IMeiliPropertySearchService, MeiliPropertySearchService>();

        return services;
    }

    public static IServiceCollection AddCustomDistributedCache(this IServiceCollection services, string? redisConnection)
    {
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            var configurationOptions = CreateRedisConfigurationOptions(redisConnection);
            services.AddStackExchangeRedisCache(options =>
            {
                options.ConfigurationOptions = configurationOptions;
                options.InstanceName = "mulkchi:";
            });
            return services;
        }

        services.AddDistributedMemoryCache();
        return services;
    }

    public static IServiceCollection AddDistributedRealtimeInfrastructure(this IServiceCollection services, string? redisConnection, IWebHostEnvironment environment)
    {
        var signalRBuilder = services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = environment.IsDevelopment();
            options.MaximumReceiveMessageSize = 128 * 1024;
            options.StreamBufferCapacity = 10;
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(120);
            options.KeepAliveInterval = TimeSpan.FromSeconds(15);
            options.HandshakeTimeout = TimeSpan.FromSeconds(30);
        });

        if (string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddSingleton<IUserConnectionTracker, UserConnectionTracker>();
            return services;
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

        return services;
    }

    public static IServiceCollection AddCustomBackgroundServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHostedService<ExpiredBookingHoldCleanupService>();
        services.AddHostedService<OutboxProcessorService>();
        services.AddHostedService<AnalyticsCollectionService>();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddHangfire(config => config
            .UsePostgreSqlStorage(connectionString)
            .WithJobExpirationTimeout(TimeSpan.FromDays(7)));

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 2;
            options.Queues = new[] { "default", "subscriptions" };
            options.ServerTimeout = TimeSpan.FromMinutes(5);
            options.ShutdownTimeout = TimeSpan.FromSeconds(30);
        });

        services.AddScoped<SubscriptionRenewalService>();
        return services;
    }

    public static IServiceCollection AddCustomOpenTelemetry(this IServiceCollection services)
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
        return services;
    }

    public static IServiceCollection AddDatabaseConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = Environment.GetEnvironmentVariable("MULKCHI_CONNECTION_STRING")
            ?? configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<StorageBroker>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IStorageBroker, StorageBroker>();
        return services;
    }

    public static IServiceCollection AddCorsConfiguration(this IServiceCollection services, IConfiguration configuration)
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

            var allowedOrigins = configuration
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
        return services;
    }

    private static ConfigurationOptions CreateRedisConfigurationOptions(string redisConnection)
    {
        var configurationOptions = ConfigurationOptions.Parse(redisConnection);
        configurationOptions.AbortOnConnectFail = false;
        configurationOptions.ConnectRetry = 3;
        configurationOptions.ConnectTimeout = 5000;
        return configurationOptions;
    }
}
