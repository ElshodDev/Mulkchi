    # Mulkchi - Full-Stack Property Platform Analysis

    > **AI-Optimized Documentation** for Cloud Platforms (AWS/Azure/GCP)  
    > **Stack**: .NET 9 + Angular 20 + SQL Server + SignalR + ML.NET  
    > **Domain**: Real Estate / Property Rental & Sales (Uzbekistan Market)

    ---

    ## 1. EXECUTIVE SUMMARY

    **Mulkchi** is a comprehensive real estate platform designed for the Uzbekistan market, connecting property hosts with guests. It supports multiple property types (rentals, sales, short-term stays) with integrated payments, real-time messaging, and AI-powered price predictions.

    ### Key Metrics
    - **API Controllers**: 15+ controllers
    - **API Endpoints**: 80+ endpoints
    - **Database Entities**: 20+ tables
    - **User Roles**: Guest, Host, Admin, SuperAdmin
    - **Payment Methods**: Payme, Click, Cash

    ---

    ## 2. SYSTEM ARCHITECTURE

    ### 2.1 High-Level Architecture

    ```
    ┌─────────────────────────────────────────────────────────────┐
    │                        CLIENT LAYER                          │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
    │  │   Web App    │  │  Mobile App  │  │   Admin      │     │
    │  │  (Angular)   │  │   (Future)   │  │   Panel      │     │
    │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
    └─────────┼─────────────────┼─────────────────┼─────────────┘
            │                 │                 │
            └─────────────────┴─────────────────┘
                                │
    ┌───────────────────────────▼─────────────────────────────────┐
    │                     API GATEWAY LAYER                        │
    │  • JWT Authentication / Authorization                         │
    │  • Rate Limiting / CORS                                     │
    │  • Request/Response Logging                                 │
    └───────────────────────────┬─────────────────────────────────┘
                                │
    ┌───────────────────────────▼─────────────────────────────────┐
    │                    BACKEND LAYER (.NET 9)                  │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
    │  │   REST API   │  │   SignalR    │  │   ML.NET     │     │
    │  │  Controllers │  │    Hubs      │  │   Services   │     │
    │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
    │         │                 │                 │              │
    │  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
    │  │   Services   │  │  Background  │  │   Brokers    │     │
    │  │   (Found.)   │  │    Jobs      │  │ (DateTime)   │     │
    │  └──────┬───────┘  └──────────────┘  └──────────────┘     │
    └─────────┼───────────────────────────────────────────────────┘
            │
    ┌─────────▼───────────────────────────────────────────────────┐
    │                   DATA LAYER                                 │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
    │  │  SQL Server  │  │    Redis     │  │ File Storage │       │
    │  │   (EF Core)  │  │   (Cache)    │  │  (Uploads)   │       │
    │  └──────────────┘  └──────────────┘  └──────────────┘       │
    └─────────────────────────────────────────────────────────────┘
    ```

    ### 2.2 Technology Stack

    | Layer | Technology | Purpose |
    |-------|------------|---------|
    | **Frontend** | Angular 20, TypeScript, RxJS | SPA with reactive state |
    | **UI Components** | Angular Material, Tailwind | Design system |
    | **Maps** | Leaflet.js | Property location display |
    | **Charts** | Chart.js | Analytics dashboards |
    | **Backend** | .NET 9, ASP.NET Core | REST API, SignalR |
    | **ORM** | EF Core 9 | Database access |
    | **Database** | SQL Server 2022 | Primary datastore |
    | **Cache** | Redis | Session, SignalR backplane |
    | **ML/AI** | ML.NET | Price prediction |
    | **Auth** | JWT Bearer, Identity | Authentication |
    | **Payments** | Payme API, Click API | Payment processing |
    | **Real-time** | SignalR | Chat, notifications |
    | **Container** | Docker, Docker Compose | Deployment |

    ---

    ## 3. DATABASE SCHEMA

    ### 3.1 Core Entities

    ```
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │     Users       │     │   Properties    │     │    Bookings     │
    ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
    │ Id (PK, GUID)   │◄────│ HostId (FK)     │     │ Id (PK, GUID)   │
    │ FirstName       │     │ Id (PK, GUID)   │◄────│ PropertyId (FK) │
    │ LastName        │     │ Title           │     │ GuestId (FK)    │────►│ Users │
    │ Email           │     │ Description     │     │ CheckInDate     │
    │ Phone           │     │ Type            │     │ CheckOutDate    │
    │ Role            │     │ Category        │     │ TotalPrice      │
    │ CurrentMode     │     │ ListingType     │     │ Status          │
    │ Badge           │     │ Region          │     │ PaymentStatus   │
    │ IsVerified      │     │ City            │     │ CreatedDate     │
    │ CreatedDate     │     │ Price (USD)     │     └─────────────────┘
    └─────────────────┘     │ SalePrice       │
                            │ MonthlyRent     │     ┌─────────────────┐
                            │ IsPublished     │     │    Payments     │
                            │ IsFeatured      │     ├─────────────────┤
                            └─────────────────┘     │ Id (PK, GUID)   │
                                                    │ BookingId (FK)  │────►│ Bookings │
                                                    │ PayerId (FK)    │────►│ Users │
                                                    │ Amount          │
                                                    │ Method          │
                                                    │ Status          │
                                                    │ IdempotencyKey  │
                                                    └─────────────────┘

    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │    Messages     │     │  Reviews        │     │   Favorites     │
    ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
    │ Id (PK, GUID)   │     │ Id (PK, GUID)   │     │ Id (PK, GUID)   │
    │ ConversationId  │     │ PropertyId (FK) │     │ UserId (FK)     │────►│ Users │
    │ SenderId (FK)   │────►│ UserId (FK)     │────►│ PropertyId (FK) │────►│ Properties │
    │ Content         │     │ Rating (1-5)    │     │ CreatedDate     │
    │ IsRead          │     │ Comment         │     └─────────────────┘
    │ CreatedDate     │     │ CreatedDate     │
    └─────────────────┘     └─────────────────┘
    ```

    ### 3.2 Enum Definitions

    ```csharp
    // User Roles (Single Identity Pattern)
    public enum UserRole {
        Guest = "Guest",           // Can browse, book
        Host = "Host",             // Can list properties
        Admin = "Admin",           // Platform management
        SuperAdmin = "SuperAdmin"  // Full access
    }

    // Host Progression Badges
    public enum HostBadge {
        New = "New",           // 0-5 listings
        Rising = "Rising",   // 5-20 listings
        Super = "Super",     // 20-50 listings  
        Legend = "Legend"    // 50+ listings
    }

    // Property Types
    public enum PropertyType {
        Apartment, House, Villa, Office, 
        Commercial, Land, Dacha
    }

    // Listing Types
    public enum ListingType {
        Sale,           // Permanent sale
        Rent,           // Long-term rent (monthly)
        ShortTermRent   // Airbnb-style (daily)
    }

    // Property Categories (for filtering)
    public enum PropertyCategory {
        Residential, Commercial, Industrial, Agricultural
    }

    // Booking Status
    public enum BookingStatus {
        Pending, Confirmed, Cancelled, Completed, NoShow
    }

    // Payment Status
    public enum PaymentStatus {
        Pending, Completed, Failed, Refunded
    }

    // Payment Methods (Uzbekistan)
    public enum PaymentMethod {
        Payme, Click, Cash, Card, Transfer
    }

    // Uzbekistan Regions
    public enum UzbekistanRegion {
        Tashkent, Samarkand, Bukhara, Andijan,
        Fergana, Namangan, Khorezm, Karakalpakstan,
        Navoi, Kashkadarya, Surkhandarya, Jizzakh,
        Syrdarya, TashkentRegion
    }
    ```

    ---

    ## 4. API ENDPOINTS

    ### 4.1 Authentication (AuthController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | POST | `/api/auth/login` | Public | JWT token generation |
    | POST | `/api/auth/register` | Public | User registration |
    | POST | `/api/auth/google` | Public | Google OAuth login |
    | POST | `/api/auth/refresh-token` | Public | Token refresh |
    | POST | `/api/auth/logout` | Bearer | Logout (invalidate tokens) |
    | POST | `/api/auth/switch-role` | Bearer | Switch Guest ↔ Host mode |
    | POST | `/api/auth/forgot-password` | Public | Password reset email |
    | POST | `/api/auth/reset-password` | Public | Set new password |

    ### 4.2 Users (UsersController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/users` | Admin | List all users (paged) |
    | GET | `/api/users/me` | Bearer | Get current user profile |
    | PUT | `/api/users/me` | Bearer | Update profile |
    | GET | `/api/users/me/properties` | Bearer | Get my property listings |
    | GET | `/api/users/{id}` | Bearer | Get user by ID |
    | DELETE | `/api/users/{id}` | Admin | Delete user |

    ### 4.3 Properties (PropertiesController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/properties` | Public | List all published properties |
    | GET | `/api/properties/{id}` | Public | Get property details |
    | POST | `/api/properties` | Host/Admin | Create property listing |
    | PUT | `/api/properties/{id}` | Host/Admin | Update property |
    | DELETE | `/api/properties/{id}` | Host/Admin | Delete property |
    | GET | `/api/properties/featured` | Public | Get featured properties |
    | GET | `/api/properties/search` | Public | Advanced search with filters |
    | GET | `/api/properties/autocomplete` | Public | Location autocomplete |
    | GET | `/api/properties/{id}/similar` | Public | Similar properties |
    | POST | `/api/properties/{id}/favorite` | Bearer | Add to favorites |
    | DELETE | `/api/properties/{id}/favorite` | Bearer | Remove from favorites |
    | POST | `/api/properties/{id}/publish` | Host/Admin | Publish property |
    | POST | `/api/properties/{id}/unpublish` | Host/Admin | Unpublish property |

    **Search Query Parameters:**
    ```
    /api/properties/search?
        region=Tashkent&
        city=Samarqand&
        type=Apartment&
        listingType=Rent&
        minPrice=500&
        maxPrice=2000&
        bedrooms=2&
        hasParking=true&
        page=1&
        pageSize=20
    ```

    ### 4.4 Bookings (BookingsController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/bookings` | Bearer | List all bookings (admin) |
    | GET | `/api/bookings/my` | Bearer | My bookings as guest |
    | GET | `/api/bookings/host` | Host/Admin | Bookings for my properties |
    | GET | `/api/bookings/{id}` | Bearer | Get booking details |
    | POST | `/api/bookings` | Bearer | Create booking |
    | POST | `/api/bookings/{id}/confirm` | Host/Admin | Confirm booking |
    | POST | `/api/bookings/{id}/cancel` | Bearer | Cancel booking |
    | PUT | `/api/bookings` | Bearer | Update booking |
    | DELETE | `/api/bookings/{id}` | Bearer | Delete booking |
    | GET | `/api/bookings/availability/{propertyId}` | Public | Check available dates |
    | POST | `/api/bookings/hold` | Bearer | Hold dates (10 min) |
    | DELETE | `/api/bookings/hold/{holdId}` | Bearer | Release hold |

    ### 4.5 Payments (PaymentsController + ClickController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/payments` | Bearer | List payments |
    | GET | `/api/payments/{id}` | Bearer | Get payment details |
    | POST | `/api/payments` | Bearer | Create payment |
    | GET | `/api/payments/my` | Bearer | My payment history |
    | **Click** | | | |
    | POST | `/api/click/prepare` | Public | Click API prepare |
    | POST | `/api/click/complete` | Public | Click API complete |
    | **Payme** | | | |
    | POST | `/api/payme` | Public | Payme merchant API |

    ### 4.6 Messages & Chat (MessagesController + ChatHub)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/messages/conversations` | Bearer | List conversations |
    | GET | `/api/messages/{conversationId}` | Bearer | Get messages |
    | POST | `/api/messages` | Bearer | Send message (REST fallback) |
    | WS | `/hubs/chat` | Bearer | SignalR real-time chat |

    ### 4.7 Reviews (ReviewsController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/reviews` | Public | List reviews |
    | GET | `/api/reviews/{id}` | Public | Get review |
    | GET | `/api/reviews/property/{propertyId}` | Public | Property reviews |
    | GET | `/api/reviews/user/{userId}` | Public | User reviews |
    | POST | `/api/reviews` | Bearer | Create review |
    | PUT | `/api/reviews` | Bearer | Update review |
    | DELETE | `/api/reviews/{id}` | Bearer | Delete review |
    | GET | `/api/reviews/property/{propertyId}/stats` | Public | Review statistics |

    ### 4.8 Analytics (AnalyticsController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/analytics/dashboard` | Admin | Dashboard metrics |
    | GET | `/api/analytics/users` | Admin | User analytics |
    | GET | `/api/analytics/properties` | Admin | Property analytics |
    | GET | `/api/analytics/bookings` | Admin | Booking analytics |
    | GET | `/api/analytics/revenue` | Admin | Revenue reports |
    | GET | `/api/analytics/host/{hostId}` | Host/Admin | Host performance |

    ### 4.9 AI/ML (AiRecommendationsController)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | POST | `/api/ai/predict-price` | Bearer | Predict property price |
    | GET | `/api/ai/recommendations/{userId}` | Bearer | Personalized recommendations |
    | GET | `/api/ai/similar/{propertyId}` | Public | Similar properties (ML) |
    | GET | `/api/ai/market-insights` | Public | Market trends |

    ### 4.10 Notifications (NotificationsController + NotificationHub)

    | Method | Endpoint | Auth | Description |
    |--------|----------|------|-------------|
    | GET | `/api/notifications` | Bearer | Get notifications |
    | POST | `/api/notifications/{id}/read` | Bearer | Mark as read |
    | POST | `/api/notifications/read-all` | Bearer | Mark all as read |
    | DELETE | `/api/notifications/{id}` | Bearer | Delete notification |
    | WS | `/hubs/notifications` | Bearer | Real-time notifications |

    ---

    ## 5. AUTHENTICATION & AUTHORIZATION

    ### 5.1 JWT Configuration

    ```csharp
    // Token Configuration
    {
        "JwtSettings": {
            "Secret": "32+ char secret key",
            "Issuer": "Mulkchi.Api",
            "Audience": "Mulkchi.Frontend",
            "AccessTokenExpirationMinutes": 60,
            "RefreshTokenExpirationDays": 7
        }
    }
    ```

    ### 5.2 Role-Based Access Control (RBAC)

    ```
    Guest ──► Can: Browse properties, book, message hosts, review
            Cannot: Create properties, view analytics

    Host ───► Can: All Guest actions + Create properties, manage bookings,
                view host analytics, withdraw earnings
            Cannot: Admin panel, manage other users

    Admin ──► Can: All Host actions + User management, analytics, 
                announcements, discounts, support tickets

    SuperAdmin ──► Can: Everything + System config, database access
    ```

    ### 5.3 Single Identity Pattern

    Users can switch between Guest and Host modes without separate accounts:

    ```csharp
    // User model has dual role support
    public class User {
        public UserRole Role { get; set; }           // Base role
        public UserRole? CurrentMode { get; set; }  // Active mode (Guest/Host)
    }
    ```

    ---

    ## 6. REAL-TIME FEATURES (SignalR)

    ### 6.1 Chat Hub (`/hubs/chat`)

    ```csharp
    // Hub Methods (Client -> Server)
    public interface IChatHub {
        Task JoinConversation(string conversationId);
        Task LeaveConversation(string conversationId);
        Task SendMessage(string conversationId, string content);
        Task MarkAsRead(string messageId);
        Task Typing(string conversationId, bool isTyping);
    }

    // Hub Events (Server -> Client)
    public interface IChatClient {
        Task ReceiveMessage(MessageDto message);
        Task UserTyping(string userId, bool isTyping);
        Task MessageRead(string messageId);
        Task UserJoined(string userId);
        Task UserLeft(string userId);
    }
    ```

    ### 6.2 Notification Hub (`/hubs/notifications`)

    ```csharp
    public interface INotificationClient {
        Task ReceiveNotification(NotificationDto notification);
        Task NotificationRead(string notificationId);
        Task UnreadCount(int count);
    }
    ```

    ---

    ## 7. AI/ML FEATURES

    ### 7.1 Price Prediction Model

    ```csharp
    // ML.NET Price Prediction
    public class PricePredictionInput {
        public string Region { get; set; }
        public string City { get; set; }
        public string PropertyType { get; set; }
        public float Area { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public bool HasParking { get; set; }
        public bool IsFurnished { get; set; }
        public float DistanceToCenter { get; set; }
    }

    public class PricePredictionOutput {
        public float PredictedPrice { get; set; }
        public float Confidence { get; set; }
    }
    ```

    ### 7.2 Training Data

    - Historical property listings (price, features, location)
    - Market trends by region
    - Seasonal pricing patterns

    ### 7.3 Endpoint Usage

    ```http
    POST /api/ai/predict-price
    Content-Type: application/json
    Authorization: Bearer {token}

    {
        "region": "Tashkent",
        "city": "Yunusabad",
        "propertyType": "Apartment",
        "area": 75.5,
        "bedrooms": 2,
        "bathrooms": 1,
        "hasParking": true,
        "isFurnished": false,
        "distanceToCenter": 3.2
    }
    ```

    ---

    ## 8. PAYMENT INTEGRATION

    ### 8.1 Payme Integration

    ```csharp
    // Payme Merchant API
    POST /api/payme
    Content-Type: application/json

    {
        "id": 123,
        "method": "CreateTransaction",
        "params": {
            "account": { "bookingId": "guid" },
            "amount": 100000,  // in tiyins (1000 UZS)
            "id": "payme-trans-id"
        }
    }
    ```

    ### 8.2 Click Integration

    ```csharp
    // Click Prepare
    POST /api/click/prepare
    merchant_trans_id={bookingId}
    merchant_prepare_id={prepareId}
    amount={amount}
    sign_time={timestamp}
    sign_string={hash}

    // Click Complete  
    POST /api/click/complete
    merchant_trans_id={bookingId}
    merchant_prepare_id={prepareId}
    amount={amount}
    error_code={0|error}
    ```

    ### 8.3 Payment Flow

    ```
    1. User creates booking
    2. System creates payment record (status: Pending)
    3. User selects payment method (Payme/Click)
    4. Redirect to payment provider
    5. Provider calls webhook (/api/payme or /api/click/complete)
    6. System updates payment status (Completed/Failed)
    7. System confirms booking
    8. Send notification to user
    ```

    ---

    ## 9. SECURITY IMPLEMENTATIONS

    ### 9.1 Authentication Security

    - JWT Bearer tokens with 60-minute expiration
    - Refresh tokens with 7-day expiration
    - Secure password hashing (BCrypt)
    - Email verification required
    - Google OAuth 2.0 integration

    ### 9.2 API Security

    ```csharp
    // Rate Limiting
    services.AddRateLimiter(options => {
        options.AddPolicy("default", context => 
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: context.User.Identity?.Name ?? "anonymous",
                factory: _ => new FixedWindowRateLimiterOptions {
                    PermitLimit = 100,
                    Window = TimeSpan.FromMinutes(1)
                }));
    });

    // CORS
    services.AddCors(options => {
        options.AddPolicy("AllowFrontend", policy => {
            policy.WithOrigins("http://localhost:4200")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });
    ```

    ### 9.3 Data Protection

    - SQL injection prevention (EF Core parameterized queries)
    - XSS protection (Angular built-in sanitization)
    - CSRF protection (for non-API routes)
    - Input validation on all endpoints

    ---

    ## 10. CLOUD DEPLOYMENT GUIDE

    ### 10.1 Docker Configuration

    ```yaml
    # docker-compose.yml
    version: '3.8'
    services:
    db:
        image: mcr.microsoft.com/mssql/server:2022-latest
        environment:
        SA_PASSWORD: "YourStrong@Passw0rd"
        ACCEPT_EULA: "Y"
        ports:
        - "1433:1433"
        volumes:
        - sql_data:/var/opt/mssql

    redis:
        image: redis:7-alpine
        ports:
        - "6379:6379"

    backend:
        build: ./Mulkchi.Api
        environment:
        ConnectionStrings__DefaultConnection: "Server=db;Database=Mulkchi;User=sa;Password=YourStrong@Passw0rd;"
        JwtSettings__Secret: "${JWT_SECRET}"
        ports:
        - "5000:80"
        depends_on:
        - db
        - redis

    frontend:
        build: ./Mulkchi.Frontend
        ports:
        - "4200:80"
        depends_on:
        - backend
    ```

    ### 10.2 AWS Deployment

    ```
    ┌─────────────────────────────────────────┐
    │              AWS Cloud                  │
    │  ┌──────────────┐  ┌──────────────┐    │
    │  │   Route 53   │  │   CloudFront │    │
    │  │   (DNS)      │  │    (CDN)     │    │
    │  └──────┬───────┘  └──────┬───────┘    │
    │         │                 │            │
    │  ┌──────▼─────────────────▼───────┐   │
    │  │      Application Load Balancer │   │
    │  └──────┬───────────────────┬────┘   │
    │         │                   │         │
    │  ┌──────▼──────┐     ┌──────▼──────┐ │
    │  │   ECS       │     │   ECS       │ │
    │  │  Frontend   │     │  Backend    │ │
    │  │  (Angular)  │     │  (.NET)     │ │
    │  └─────────────┘     └──────┬──────┘ │
    │                             │        │
    │                    ┌────────▼──────┐ │
    │                    │   RDS         │ │
    │                    │ (SQL Server)  │ │
    │                    └───────────────┘ │
    │                    ┌──────────────┐  │
    │                    │ ElastiCache  │  │
    │                    │   (Redis)    │  │
    │                    └──────────────┘  │
    └─────────────────────────────────────────┘
    ```

    ### 10.3 Azure Deployment

    ```
    ┌─────────────────────────────────────────┐
    │           Azure Cloud                     │
    │  ┌──────────────┐  ┌──────────────┐    │
    │  │ Azure DNS    │  │   Azure CDN  │    │
    │  └──────┬───────┘  └──────┬───────┘    │
    │         │                 │            │
    │  ┌──────▼─────────────────▼───────┐   │
    │  │   Azure App Gateway           │   │
    │  └──────┬───────────────────┬────┘   │
    │         │                   │         │
    │  ┌──────▼──────┐     ┌──────▼──────┐ │
    │  │ Static Web  │     │ Azure App   │ │
    │  │  Apps       │     │  Service    │ │
    │  │ (Frontend)  │     │ (Backend)   │ │
    │  └─────────────┘     └──────┬──────┘ │
    │                             │        │
    │                    ┌────────▼──────┐ │
    │                    │ Azure SQL     │ │
    │                    │  Database     │ │
    │                    └───────────────┘ │
    │                    ┌──────────────┐  │
    │                    │ Azure Cache  │  │
    │                    │ for Redis    │  │
    │                    └──────────────┘  │
    └─────────────────────────────────────────┘
    ```

    ---

    ## 11. MONITORING & HEALTH CHECKS

    ### 11.1 Health Endpoints

    ```
    GET /health           - Overall health
    GET /health/database  - Database connectivity
    GET /health/redis     - Redis connectivity
    GET /health/file-storage - File storage access
    ```

    ### 11.2 Logging

    ```csharp
    // Structured logging with Serilog
    Log.Information("User {UserId} booked property {PropertyId} for {Amount}", 
        userId, propertyId, amount);
    ```

    ---

    ## 12. FRONTEND ARCHITECTURE

    ### 12.1 Angular Project Structure

    ```
    src/
    ├── app/
    │   ├── core/                    # Singleton services, guards, interceptors
    │   │   ├── services/            # API services
    │   │   ├── guards/              # Auth guards
    │   │   ├── interceptors/        # JWT, Error interceptors
    │   │   └── models/              # TypeScript interfaces
    │   ├── features/                # Feature modules (lazy loaded)
    │   │   ├── home/                # Home page, search
    │   │   ├── properties/          # Property list, detail, form
    │   │   ├── auth/                # Login, register, forgot password
    │   │   ├── bookings/            # Booking list, detail
    │   │   ├── messages/            # Chat, conversations
    │   │   ├── host/                # Host dashboard, properties
    │   │   ├── admin/               # Admin panel
    │   │   └── profile/             # User profile
    │   ├── shared/                  # Shared components, pipes, directives
    │   └── layout/                  # Header, footer, navigation
    ├── assets/                      # Images, fonts, i18n
    └── environments/                # Environment configs
    ```

    ### 12.2 Key Frontend Services

    | Service | Purpose |
    |---------|---------|
    | `AuthService` | JWT management, login/logout |
    | `PropertyService` | Property CRUD, search |
    | `BookingService` | Booking operations |
    | `PaymentService` | Payment processing |
    | `ChatService` | SignalR chat connection |
    | `NotificationService` | Real-time notifications |
    | `AiService` | Price prediction |
    | `SeoService` | Meta tags, OpenGraph |

    ### 12.3 State Management

    ```typescript
    // Angular Signals for reactive state
    export class AuthService {
        private _currentUser = signal<User | null>(null);
        readonly currentUser = computed(() => this._currentUser());
        
        private _accessToken = signal<string | null>(null);
        readonly isAuthenticated = computed(() => !!this._accessToken());
    }
    ```

    ---

    ## 13. PERFORMANCE OPTIMIZATIONS

    ### 13.1 Backend Optimizations

    - **EF Core**: Compiled queries, projection with Select
    - **Caching**: Redis for hot data
    - **Pagination**: All list endpoints use offset/limit
    - **Rate Limiting**: 100 requests/minute per user

    ### 13.2 Frontend Optimizations

    - **Lazy Loading**: Feature modules loaded on demand
    - **Image Optimization**: WebP format, lazy loading
    - **Bundle Splitting**: Separate chunks per feature
    - **Service Workers**: PWA support for offline

    ---

    ## 14. API DOCUMENTATION

    ### 14.1 Swagger/OpenAPI

    ```
    Development: http://localhost:5000/swagger
    Production: https://api.mulkchi.uz/swagger
    ```

    ### 14.2 Postman Collection

    Location: `/docs/Mulkchi-API-Postman-Collection.json`

    ---

    ## 15. DEVELOPMENT WORKFLOW

    ### 15.1 Git Branching Strategy

    ```
    main (production)
    └── develop (integration)
            ├── feature/auth-fix
            ├── feature/ui-redesign
            ├── feature/ai-price
            └── feature/signalr-chat
    ```

    ### 15.2 CI/CD Pipeline

    ```yaml
    # .github/workflows/ci.yml
    name: CI/CD
    on: [push, pull_request]

    jobs:
    backend:
        runs-on: ubuntu-latest
        steps:
        - uses: actions/checkout@v4
        - name: Setup .NET
            uses: actions/setup-dotnet@v4
            with:
            dotnet-version: '9.0.x'
        - run: dotnet restore
        - run: dotnet build
        - run: dotnet test

    frontend:
        runs-on: ubuntu-latest
        steps:
        - uses: actions/checkout@v4
        - name: Setup Node
            uses: actions/setup-node@v4
            with:
            node-version: '20'
        - run: npm ci
        - run: npm run build
        - run: npm run test
    ```

    ---

    ## 16. BUSINESS RULES

    ### 16.1 Booking Rules

    - **Hold Duration**: 10 minutes for date selection
    - **Cancellation**: Free within 24 hours of booking
    - **Overbooking Prevention**: Atomic transactions with date blocking
    - **Pricing**: Automatic currency conversion (USD base)

    ### 16.2 Host Rules

    - **Listing Limit**: 5 properties for New badge hosts
    - **Response Time**: Must respond within 24 hours
    - **Commission**: 10% platform fee on bookings
    - **Verification**: Phone + ID verification required

    ### 16.3 Review Rules

    - **Eligibility**: Only after completed stay
    - **Moderation**: Auto-flag inappropriate content
    - **Response**: Host can reply to reviews

    ---

    ## 17. DATABASE MIGRATIONS

    ### 17.1 Migration History

    ```bash
    # List migrations
    dotnet ef migrations list --project Mulkchi.Api

    # Add new migration
    dotnet ef migrations add "AddPaymentIdempotency" --project Mulkchi.Api

    # Apply migrations
    dotnet ef database update --project Mulkchi.Api
    ```

    ### 17.2 Key Migration Points

    - Initial schema creation
    - Single Identity implementation (Role + CurrentMode)
    - Payment idempotency key support
    - Booking hold mechanism
    - AI recommendation tables

    ---

    ## 18. TESTING

    ### 18.1 Test Projects

    - **Mulkchi.Api.Tests.Unit**: Service layer unit tests
    - **Mulkchi.Tests**: Integration tests

    ### 18.2 Test Coverage Areas

    ```
    ✓ Authentication (login, register, JWT)
    ✓ Property CRUD operations
    ✓ Booking flow (create, confirm, cancel)
    ✓ Payment processing (mock providers)
    ✓ Search and filtering
    ✓ RBAC authorization
    ```

    ---

    ## 19. TROUBLESHOOTING

    ### 19.1 Common Issues

    | Issue | Solution |
    |-------|----------|
    | JWT 401 errors | Check token expiration, refresh token |
    | SignalR not connecting | Verify WebSocket support, CORS config |
    | Database timeout | Check connection string, pool size |
    | Payment webhook fails | Verify SSL, webhook URL accessibility |

    ### 19.2 Debug Logging

    ```bash
    # Enable verbose logging
    export ASPNETCORE_ENVIRONMENT=Development
    export Logging__LogLevel__Default=Debug
    ```

    ---

    ## 20. CONCLUSION

    **Mulkchi** is a production-ready real estate platform with:

    - ✅ Scalable architecture (microservices-ready)
    - ✅ Comprehensive feature set (booking, payments, chat, AI)
    - ✅ Uzbekistan-specific integrations (Payme, Click)
    - ✅ Real-time capabilities (SignalR)
    - ✅ AI-powered features (price prediction)
    - ✅ Cloud-native deployment (Docker, K8s ready)
    - ✅ Security best practices (JWT, RBAC, rate limiting)

    ### Next Steps for Cloud Deployment:

    1. **Setup CI/CD**: GitHub Actions → AWS/Azure
    2. **Configure Secrets**: JWT keys, DB connections, API keys
    3. **Deploy Database**: RDS (AWS) or Azure SQL
    4. **Deploy Backend**: ECS/Fargate or App Service
    5. **Deploy Frontend**: S3/CloudFront or Static Web Apps
    6. **Configure CDN**: For static assets
    7. **Setup Monitoring**: CloudWatch or Application Insights
    8. **Configure SSL**: HTTPS certificates

    ---

    **Document Version**: 1.0  
    **Last Updated**: 2026-04-21  
    **Author**: Mulkchi Dev Team  
    **License**: MIT
