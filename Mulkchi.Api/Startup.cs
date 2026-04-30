using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Notifications;
using Microsoft.AspNetCore.SignalR;
using Mulkchi.Api.Hubs;
using Mulkchi.Api.Middleware;
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
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Bookings;
using Mulkchi.Api.Services.Foundations.Boosts;
using Mulkchi.Api.Services.Foundations.Subscriptions;
using Mulkchi.Api.Services.Foundations.Geo;
using Mulkchi.Api.Services.Foundations.Amenities;
using Mulkchi.Api.Services.Foundations.Chat;
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
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using StackExchange.Redis;

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
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler =
                    System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.DefaultIgnoreCondition =
                    System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
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
        AddDistributedCache(services);
        
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
        // Check for Redis connection: MULKCHI_REDIS_URL env var takes priority, then Redis:ConnectionString
        var redisConnection = Environment.GetEnvironmentVariable("MULKCHI_REDIS_URL")
            ?? this.configuration["Redis:ConnectionString"];

        var signalRBuilder = services.AddSignalR(options =>
        {
            // WebSocket-specific settings
            options.EnableDetailedErrors = this.environment.IsDevelopment();
            options.MaximumReceiveMessageSize = 64 * 1024; // 64KB max message size
            options.StreamBufferCapacity = 10;
            
            // Connection timeout settings - increased to prevent 1011 errors
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(120); // Increased from 60s
            options.KeepAliveInterval = TimeSpan.FromSeconds(30); // Increased from 15s
            options.HandshakeTimeout = TimeSpan.FromSeconds(30);
        });

        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            signalRBuilder.AddStackExchangeRedis(redisConnection, options =>
            {
                options.Configuration.ChannelPrefix = RedisChannel.Literal("mulkchi-signalr");
            });
        }

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
        app.UseSecurityHeaders();
        app.UseCors(env.IsDevelopment() ? "AllowAngular" : "Production");

        // Add global exception handling
        app.UseGlobalExceptionHandling();

        // Add rate limiting middleware
        app.UseMiddleware<RateLimitMiddleware>();

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

        app.UseRouting();
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
                    var path = context.HttpContext.Request.Path;

                    if (path.StartsWithSegments("/hubs"))
                    {
                        // SignalR WebSocket: prefer query-string token (accessTokenFactory),
                        // fall back to httpOnly cookie for SSE/long-polling transports.
                        var queryToken = context.Request.Query["access_token"].ToString();
                        if (!string.IsNullOrEmpty(queryToken))
                        {
                            context.Token = queryToken;
                            return Task.CompletedTask;
                        }
                    }

                    // For all requests (including hubs that did not supply a query token):
                    // read the access token from the httpOnly cookie.
                    if (context.Request.Cookies.TryGetValue("access_token", out var cookieToken)
                        && !string.IsNullOrEmpty(cookieToken))
                    {
                        context.Token = cookieToken;
                    }

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

        // Rate limiting — singleton because the in-memory window state must persist
        // across requests.  Swap InMemoryRateLimitService for a Redis-backed
        // implementation here when scaling out to multiple pods.
        services.AddSingleton<IRateLimitService, InMemoryRateLimitService>();
    }

    private void AddFoundationServices(IServiceCollection services)
    {
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IUserService, UserService>();
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
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        // Singleton: connection tracker must outlive individual HTTP requests
        services.AddScoped<IPriceRecommendationService, PriceRecommendationService>();
        services.AddScoped<IAIRecommendationEngine, AIRecommendationEngine>();
        
        // Clean Architecture: Repository Pattern
        services.AddScoped(typeof(Application.Interfaces.IRepository<>), typeof(Infrastructure.Repositories.Repository<>));
        services.AddScoped<Application.Interfaces.IUnitOfWork, Infrastructure.Repositories.UnitOfWork>();
        
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

    private void AddDistributedCache(IServiceCollection services)
    {
        // Check for Redis connection: MULKCHI_REDIS_URL env var takes priority, then Redis:ConnectionString
        var redisConnection = Environment.GetEnvironmentVariable("MULKCHI_REDIS_URL")
            ?? this.configuration["Redis:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnection;
                options.InstanceName = "mulkchi:";
            });
            return;
        }

        services.AddDistributedMemoryCache();
    }

    private void AddBackgroundServices(IServiceCollection services)
    {
        services.AddHostedService<ExpiredBookingHoldCleanupService>();
        services.AddHostedService<OutboxProcessorService>();
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
            options.UseSqlServer(connectionString));

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

            options.AddPolicy("AllowAll", builder =>
            {
                builder
                    .WithOrigins(
                        "http://localhost:4200",
                        "http://localhost:4201",
                        "http://localhost:3000"
                    )
                    .AllowAnyMethod()
                    .AllowAnyHeader()
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
