# 🗺️ MULKCHI - LOYIHA XARITASI

> **Loyiha:** Mulkchi - AQILLI Ko'chmas Mulk Platformasi  
> **Arxitektura:** Clean Architecture + Onion Architecture  
> **Backend:** .NET 9 + PostgreSQL  
> **Frontend:** Angular 18 + TypeScript  
> **Versiya:** 2.0 (Smart Analytics Edition)

---

## 📁 LOYIHA STRUKTURASI

```
Mulkchi/
├── 📂 .github/                    # GitHub Actions CI/CD
│   └── workflows/
│       └── dotnet.yml
├── 📂 Mulkchi.Api/                # 🏗️ BACKEND API (.NET 9)
│   ├── 📂 Brokers/                 # 📡 Data Access Layer
│   │   ├── 📂 Loggings/           # Logging Broker
│   │   ├── 📂 Notifications/      # Notification Broker (Email/SMS)
│   │   ├── 📂 Storages/           # 🗄️ Database Broker (EF Core)
│   │   │   ├── 📂 Analytics/      # Analytics DbSet configs
│   │   │   ├── 📂 Properties/     # Property DbSet configs
│   │   │   ├── 📂 Users/          # User DbSet configs
│   │   │   ├── IStorageBroker.cs  # Interface
│   │   │   └── StorageBroker.cs   # Implementation
│   │   └── 📂 Tokens/             # JWT Token Broker
│   │
│   ├── 📂 Controllers/            # 🌐 API Controllers (REST)
│   │   ├── AnalyticsController.cs      # 📊 Smart Analytics API
│   │   ├── AiRecommendationsController.cs # 🤖 AI Tavsiyalar
│   │   ├── AuthController.cs            # 🔐 Authentication
│   │   ├── BookingsController.cs        # 📅 Bron qilish
│   │   ├── PropertiesController.cs      # 🏠 Mulk e'lonlari
│   │   ├── UsersController.cs           # 👤 Foydalanuvchilar
│   │   ├── FavoritesController.cs       # ❤️ Sevimlilar
│   │   ├── MessagesController.cs        # 💬 Chat xabarlar
│   │   ├── ReviewsController.cs         # ⭐ Sharhlar
│   │   └── ... (20+ controllers)
│   │
│   ├── 📂 Models/                 # 📦 Domain Models (Entities + DTOs)
│   │   ├── 📂 Analytics/        # Smart Analytics Models
│   │   │   └── PropertyAnalysisModels.cs
│   │   ├── 📂 Foundations/        # 🏛️ Core Domain Models
│   │   │   ├── 📂 AI/            # AI tavsiya modellari
│   │   │   │   └── PriceRecommendationModels.cs
│   │   │   ├── 📂 AIs/           # AI Exceptions + Hybrid Models
│   │   │   ├── 📂 Analytics/     # 🧮 Analytics Entities
│   │   │   │   ├── DistrictStat.cs      # Hudud statistikasi
│   │   │   │   ├── MarketTrend.cs       # Bozor trendlari
│   │   │   │   └── PriceHistory.cs      # Narx tarixi
│   │   │   ├── 📂 Amenities/     # 🎯 Qulayliklar
│   │   │   ├── 📂 Announcements/ # 📢 E'lonlar
│   │   │   ├── 📂 Auth/          # 🔐 Auth modellari
│   │   │   ├── 📂 Boosts/        # 🚀 E'lon ko'tarish
│   │   │   ├── 📂 Bookings/      # 📅 Bron modellari
│   │   │   ├── 📂 Chat/          # 💬 Chat modellari
│   │   │   ├── 📂 Common/        # 🔄 Umumiy (PagedResult, etc.)
│   │   │   ├── 📂 OTP/           # 📱 SMS tasdiqlash
│   │   │   ├── 📂 Payments/      # 💳 To'lov modellari
│   │   │   ├── 📂 Properties/      # 🏠 Mulk modellari (MAIN)
│   │   │   │   ├── Property.cs          # Asosiy Entity
│   │   │   │   ├── PropertyType.cs      # Enum
│   │   │   │   ├── ListingType.cs       # Enum
│   │   │   │   ├── UzbekistanRegion.cs  # Enum
│   │   │   │   └── ...
│   │   │   ├── 📂 Reviews/       # ⭐ Sharhlar
│   │   │   ├── 📂 Subscriptions/ # 💎 Obunalar
│   │   │   ├── 📂 Users/         # 👤 Foydalanuvchilar
│   │   │   │   ├── User.cs
│   │   │   │   ├── UserRole.cs
│   │   │   │   └── ...
│   │   │   └── 📂 Views/         # 👁️ View modellari
│   │   └── ...
│   │
│   ├── 📂 Services/               # ⚙️ Business Logic Layer
│   │   ├── 📂 Background/         # 🔄 Background Services
│   │   │   ├── AnalyticsCollectionService.cs  # 📊 Analytics yig'ish
│   │   │   ├── ExpiredBookingHoldCleanupService.cs
│   │   │   └── OutboxProcessorService.cs
│   │   ├── 📂 Foundations/        # 🏛️ Core Services
│   │   │   ├── 📂 Analytics/      # 📊 Smart Analytics Services
│   │   │   │   ├── AnalyticsService.cs       # Implementation
│   │   │   │   ├── IAnalyticsService.cs      # Interface
│   │   │   │   └── AnalyticsService.PropertyAnalysis.cs
│   │   │   ├── 📂 AiRecommendations/  # 🤖 AI Services
│   │   │   │   ├── AiRecommendationService.cs
│   │   │   │   ├── AiRecommendationService.ML.cs
│   │   │   │   └── AiRecommendationService.Hybrid.cs
│   │   │   ├── 📂 Properties/     # 🏠 Property Services
│   │   │   ├── 📂 Users/          # 👤 User Services
│   │   │   ├── 📂 Bookings/       # 📅 Booking Services
│   │   │   └── ...
│   │   └── 📂 Processing/         # 🔄 Data Processing
│   │
│   ├── 📂 Middleware/             # 🔌 Custom Middleware
│   │   ├── ErrorHandlingMiddleware.cs
│   │   ├── RequestResponseLoggingMiddleware.cs
│   │   └── SecurityHeadersMiddleware.cs
│   │
│   ├── 📂 Migrations/             # 🗄️ EF Core Migrations
│   ├── 📂 Validators/             # ✅ FluentValidation
│   ├── 📂 DataSeed/               # 🌱 Seed Data
│   ├── 📂 Hubs/                   # 📡 SignalR Real-time
│   ├── 📂 Infrastructure/         # 🔧 Infrastructure
│   ├── 📂 Resources/              # 📄 Localization
│   │
│   ├── Program.cs                 # 🚀 Entry Point
│   ├── Startup.cs                 # ⚙️ Configuration
│   └── appsettings.json           # 🔧 Settings
│
├── 📂 Mulkchi.Api.Tests/          # 🧪 Unit & Integration Tests
│   └── ...
│
├── 📂 Mulkchi.Frontend/           # 🎨 FRONTEND (Angular 18)
│   ├── 📂 src/
│   │   ├── 📂 app/
│   │   │   ├── 📂 core/            # 🎯 Core Module
│   │   │   │   ├── 📂 guards/     # 🔒 Route Guards
│   │   │   │   │   ├── admin.guard.ts
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   └── host.guard.ts
│   │   │   │   ├── 📂 interceptors/  # 🔌 HTTP Interceptors
│   │   │   │   │   ├── auth.interceptor.ts
│   │   │   │   │   ├── error.interceptor.ts
│   │   │   │   │   └── loader.interceptor.ts
│   │   │   │   ├── 📂 layout/     # 🎨 Layout Components
│   │   │   │   │   ├── layout/
│   │   │   │   │   │   └── layout.component.ts
│   │   │   │   │   ├── navbar/
│   │   │   │   │   │   └── navbar.component.ts
│   │   │   │   │   ├── sidebar/
│   │   │   │   │   │   └── sidebar.component.ts
│   │   │   │   │   └── footer/
│   │   │   │   │       └── footer.component.ts
│   │   │   │   ├── 📂 models/     # 📦 TypeScript Models
│   │   │   │   │   ├── property.model.ts
│   │   │   │   │   ├── user.model.ts
│   │   │   │   │   └── ...
│   │   │   │   ├── 📂 services/   # 📡 HTTP Services
│   │   │   │   │   ├── analytics.service.ts    # 📊 Smart Analytics API
│   │   │   │   │   ├── property.service.ts     # 🏠 Property API
│   │   │   │   │   ├── ai.service.ts           # 🤖 AI API
│   │   │   │   │   ├── auth.service.ts         # 🔐 Auth API
│   │   │   │   │   ├── comparison.service.ts   # ⚖️ Comparison
│   │   │   │   │   └── ...
│   │   │   │   ├── 📂 stores/     # 🏪 State Management (Signals)
│   │   │   │   │   ├── auth.store.ts
│   │   │   │   │   ├── ui.store.ts
│   │   │   │   │   └── property.store.ts
│   │   │   │   └── 📂 utils/      # 🛠️ Utilities
│   │   │   │
│   │   │   ├── 📂 features/       # 🎨 Feature Modules
│   │   │   │   ├── 📂 admin/      # 👑 Admin Panel
│   │   │   │   │   └── ...
│   │   │   │   ├── 📂 ai-price/   # 💰 AI Narx Bashorati
│   │   │   │   │   └── ai-price.component.ts
│   │   │   │   ├── 📂 auth/       # 🔐 Authentication
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   └── forgot-password/
│   │   │   │   ├── 📂 bookings/   # 📅 Bron qilish
│   │   │   │   ├── 📂 errors/     # ❌ Error Pages
│   │   │   │   ├── 📂 favorites/  # ❤️ Sevimlilar
│   │   │   │   ├── 📂 home/       # 🏠 Bosh Sahifa
│   │   │   │   ├── 📂 host/       # 🏨 Mezbon Kabineti
│   │   │   │   ├── 📂 market-analytics/  # 📊 Analytics Dashboard
│   │   │   │   │   ├── market-analytics.component.ts
│   │   │   │   │   └── smart-analytics.component.ts  # 🆕 AQILLI Tahlil
│   │   │   │   ├── 📂 messages/   # 💬 Xabarlar
│   │   │   │   ├── 📂 profile/    # 👤 Profil
│   │   │   │   └── 📂 properties/ # 🏠 Mulk E'lonlari
│   │   │   │       ├── property-list/           # 📋 Ro'yxat
│   │   │   │       ├── property-detail/         # 🔍 Tafsilotlar
│   │   │   │       ├── property-form/           # ➕ E'lon yaratish
│   │   │   │       ├── property-compare/        # ⚖️ Taqqoslash
│   │   │   │       ├── property-analysis/       # 🆕 AQILLI Tahlil Widget
│   │   │   │       │   └── property-analysis-widget.component.ts
│   │   │   │       └── ai-recommendations/     # 🤖 AI Tavsiyalar
│   │   │   │           └── ai-recommendations.component.ts
│   │   │   │
│   │   │   ├── 📂 shared/         # 🔄 Shared Module
│   │   │   │   ├── 📂 components/  # 🧩 Reusable Components
│   │   │   │   ├── 📂 directives/  # 🎯 Directives
│   │   │   │   └── 📂 pipes/       # 🧪 Pipes
│   │   │   │
│   │   │   ├── app.component.ts    # 🚀 Root Component
│   │   │   ├── app.config.ts       # ⚙️ App Config
│   │   │   └── app.routes.ts       # 🛣️ Routes
│   │   │
│   │   ├── 📂 assets/             # 🖼️ Static Assets
│   │   │   ├── images/
│   │   │   └── i18n/              # 🌐 Translations
│   │   │
│   │   ├── 📂 environments/       # 🌍 Environment Configs
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   │
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   │
│   ├── angular.json               # ⚙️ Angular CLI Config
│   ├── package.json               # 📦 NPM Dependencies
│   ├── proxy.conf.js              # 🔄 Dev Proxy (Port 5000)
│   └── tsconfig.json              # 📘 TypeScript Config
│
├── 📄 ARCHITECTURE.md             # 🏗️ Arxitektura Hujjati
├── 📄 PROJECT_MAP.md              # 🗺️ Siz o'qiyotgan fayl
├── 📄 LICENSE
├── 📄 Mulkchi.sln                 # 💼 Solution File
└── 📄 nginx.conf                  # 🌐 Nginx Config (Production)
```

---

## 🎯 CLEAN ARCHITECTURE QATLAMLARI

```
┌─────────────────────────────────────────────────────────────┐
│                    🎨 PRESENTATION LAYER                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   Controllers  │  │     Hubs       │  │  Middleware    │ │
│  │   (REST API)   │  │  (SignalR)     │  │ (Auth/Logging) │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   ⚙️ APPLICATION LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Services (Business Logic)                  │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │  Analytics  │ │  Properties │ │   AI Recommend  │   │ │
│  │  │   Service   │ │   Service   │ │     Service     │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    🗄️ INFRASTRUCTURE LAYER                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │     Brokers    │  │   Background   │  │   Validators   │ │
│  │   (EF Core)    │  │   Services     │  │  (FluentAPI)   │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     📦 DOMAIN LAYER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Models/Entities                      │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │  Property   │ │    User     │ │   Booking   │       │ │
│  │  │  District   │ │  Analytics  │ │   Review    │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 SMART ANALYTICS ARXITEKTURASI

```
┌──────────────────────────────────────────────────────────────┐
│                     🤖 SMART ANALYTICS                        │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              📊 PROPERTY ANALYSIS ENGINE              │   │
│  │  • Overpriced/Underpriced Detection                   │   │
│  │  • Market Comparison                                  │   │
│  │  • Value Score Calculation (0-100)                    │   │
│  │  • Comparable Properties Analysis                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                                 │
│  ┌───────────────────────────┼────────────────────────────┐   │
│  │                           │                            │   │
│  ▼                           ▼                            ▼   │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ 🎯 LOCATION    │  │ 💰 PRICE      │  │ 🔍 SMART       │   │
│  │   INTELLIGENCE │  │  INTELLIGENCE │  │   FILTERS      │   │
│  │                │  │                │  │                │   │
│  │ • Living Score │  │ • Prediction  │  │ • Best Deals   │   │
│  │ • 8 Criteria   │  │ • Forecasting │  │ • High ROI     │   │
│  │ • Pros/Cons    │  │ • Confidence  │  │ • Fast Selling │   │
│  └────────────────┘  └──────────────┘  └────────────────┘   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           🔄 BACKGROUND DATA COLLECTION                │   │
│  │  • PriceHistory (Daily)                                │   │
│  │  • DistrictStats (Hourly)                              │   │
│  │  • MarketTrends (Daily)                                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                    🐘 POSTGRESQL DATABASE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │    👤 Users   │     │   🏠 Properties│    │  📅 Bookings │ │
│  │──────────────│     │──────────────│     │──────────────│ │
│  │ PK: Id       │◄────►│ PK: Id       │◄────►│ PK: Id      │ │
│  │ Email        │     │ FK: HostId   │     │ FK: Property │ │
│  │ PhoneNumber  │     │ Title        │     │ FK: UserId   │ │
│  │ Role         │     │ Price        │     │ Status       │ │
│  │ CreatedAt    │     │ Region       │     │ Dates        │ │
│  └──────────────┘     │ District     │     └──────────────┘ │
│                       │ Type         │                    │
│  ┌──────────────┐     │ Status       │     ┌──────────────┐ │
│  │  ⭐ Reviews   │     │ Amenities    │     │ ❤️ Favorites │ │
│  │──────────────│     └──────────────┘     │──────────────│ │
│  │ PK: Id       │            │              │ PK: Id       │ │
│  │ FK: Property │            │              │ FK: Property │ │
│  │ FK: User     │            ▼              │ FK: User     │ │
│  │ Rating       │     ┌──────────────┐     └──────────────┘ │
│  │ Comment      │     │ 🎯 Analytics │                    │
│  └──────────────┘     │──────────────│                    │
│                       │ PriceHistory │                    │
│  ┌──────────────┐     │ MarketTrend  │                    │
│  │  💬 Messages  │     │ DistrictStat │                    │
│  │──────────────│     └──────────────┘                    │
│  │ PK: Id       │                                         │
│  │ FK: Sender   │     ┌──────────────┐                     │
│  │ FK: Receiver │     │ 🤖 AI Recs   │                     │
│  │ Content      │     │──────────────│                     │
│  │ IsRead       │     │ PK: Id       │                     │
│  └──────────────┘     │ FK: User     │                     │
│                       │ FK: Property │                     │
│                       │ Score        │                     │
│                       │ Reason       │                     │
│                       └──────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 FRONTEND COMPONENT ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────┐
│                     🅰️ ANGULAR 18 APP                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    🏠 CORE MODULE                        │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐         │  │
│  │  │   Guards   │ │Interceptors│ │   Stores   │         │  │
│  │  │ (Auth/Role)│ │(JWT/Error) │ │(Auth/UI)   │         │  │
│  │  └────────────┘ └────────────┘ └────────────┘         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐         │  │
│  │  │  Services  │ │   Models   │ │  Layout    │         │  │
│  │  │(Analytics) │ │(Property)  │ │(Navbar)    │         │  │
│  │  └────────────┘ └────────────┘ └────────────┘         │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                                 │
│  ┌───────────────────────────┼────────────────────────────┐  │
│  │                           │                            │  │
│  ▼                           ▼                            ▼  │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ 🏠 PROPERTIES  │  │ 📊 ANALYTICS │  │ 🔐 AUTH        │  │
│  │                │  │                │  │                │  │
│  │ • List       │  │ • Market     │  │ • Login        │  │
│  │ • Detail     │  │ • Smart      │  │ • Register     │  │
│  │ • Compare    │  │ • AI Recs    │  │ • Reset Pass   │  │
│  │ • AI Widget  │  │ • Price Pred │  │                │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
│                                                                │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ 📅 BOOKINGS    │  │ 💬 MESSAGES  │  │ 👤 PROFILE     │  │
│  │                │  │                │  │                │  │
│  │ • Calendar     │  │ • Chat       │  │ • Settings     │  │
│  │ • Requests     │  │ • Real-time  │  │ • My Listings  │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 API ENDPOINTS (Smart Analytics)

```
BASE URL: http://localhost:5000/api

📊 SMART ANALYTICS
├── GET  /analytics/market-overview           # Bozor umumiy ko'rinishi
├── GET  /analytics/by-region                 # Viloyat bo'yicha
├── GET  /analytics/by-district               # Tuman bo'yicha
├── GET  /analytics/price-trends              # Narx trendlari
│
🤖 PROPERTY ANALYSIS
├── GET  /analytics/property-analysis/{id}    # Mulk tahlili
├── GET  /analytics/property-deal-score/{id} # Deal baholash
├── GET  /analytics/price-prediction/{id}     # Narx bashorati
├── GET  /analytics/price-history/{id}        # Narx tarixi
│
🎯 LOCATION INTELLIGENCE
├── GET  /analytics/location-score            # Hudud reytingi
│   ?district=Yunusobod&region=ToshkentShahar
├── GET  /analytics/location-insights         # Hudud tahlili
├── GET  /analytics/price-forecast            # Narx prognozi
│
🔍 SMART FILTERS
├── GET  /analytics/smart-filters/best-deals    # Eng yaxshi takliflar
├── GET  /analytics/smart-filters/high-roi      # Yuqori ROI
├── GET  /analytics/smart-filters/fast-selling   # Tez sotiladigan
│
🤖 AI RECOMMENDATIONS
├── POST /ai-recommendations/hybrid/{userId}    # Hybrid AI tavsiya
├── GET  /ai-recommendations/behavioral/{userId}# Xatti-harakat asosida
└── GET  /ai-recommendations/similar/{propertyId} # O'xshash mulklar
```

---

## 📦 KEY FILES & RESPONSIBILITIES

### 🏗️ Backend

| Fayl | Vazifasi |
|------|----------|
| `Program.cs` | Ilova entry point, middleware pipeline |
| `Startup.cs` | DI container, service registration |
| `StorageBroker.cs` | EF Core DbContext, entity configs |
| `AnalyticsService.cs` | Smart Analytics business logic |
| `AnalyticsController.cs` | Analytics API endpoints |
| `AnalyticsCollectionService.cs` | Background data collection |

### 🎨 Frontend

| Fayl | Vazifasi |
|------|----------|
| `analytics.service.ts` | Analytics HTTP client |
| `smart-analytics.component.ts` | Smart Analytics Dashboard |
| `property-analysis-widget.component.ts` | Property analysis widget |
| `ai-recommendations.component.ts` | AI tavsiyalar sahifasi |
| `app.routes.ts` | Routing configuration |

---

## 🎯 DEVELOPMENT WORKFLOW

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Plan   │────▶│  Design  │────▶│ Develop  │────▶│   Test   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                          │
                                                          ▼
┌──────────┐     ┌──────────┐     ┌──────────────────────────┐
│ Deploy   │◀────│  Review  │◀────│       Release            │
└──────────┘     └──────────┘     └──────────────────────────┘
```

---

## 📊 PROJECT STATISTICS

```
📁 Umumiy Fayllar:
├── Backend:        ~540 fayl
├── Frontend:       ~105 fayl
├── Controllers:    20+ ta
├── Services:       101+ ta
├── Models:         287+ ta
├── Components:     50+ ta
└── Umumiy:         ~645 fayl

🏗️ Arxitektura:
├── Layers:         4 (Domain, Infrastructure, Application, Presentation)
├── Clean Arch:     ✅ Followed
├── SOLID:          ✅ Applied
├── DRY:            ✅ Applied
└── Test Coverage:  Unit + Integration Tests

🤖 AI/ML Features:
├── Recommendation: Hybrid (Collaborative + Content-Based)
├── Price Analysis: Statistical + Comparative
├── Location Score: Multi-criteria (8 criteria)
└── Prediction:     Trend-based forecasting
```

---

## 🔧 DEVELOPMENT COMMANDS

```bash
# BACKEND (Port 5000)
cd Mulkchi.Api
dotnet run --urls http://localhost:5000

# FRONTEND (Port 4200)
cd Mulkchi.Frontend
npm install
npx ng serve --port 4200

# DATABASE MIGRATION
dotnet ef migrations add MigrationName
dotnet ef database update

# TESTS
dotnet test                    # Backend tests
npm run test                   # Frontend tests
```

---

## ✅ CLEAN ARCHITECTURE CHECKLIST

- ✅ **Separation of Concerns** - Qatlamalaj ajratilgan
- ✅ **Dependency Inversion** - Interfaces orqali bog'liqlik
- ✅ **Single Responsibility** - Har bir class bitta vazifa
- ✅ **Open/Closed** - Extension uchun ochiq
- ✅ **Domain-Driven** - Domain models markazda
- ✅ **No God Classes** - Katta universal class yo'q
- ✅ **Testable** - Unit testlar yozilishi mumkin
- ✅ **Maintainable** - Oson qo'llab-quvvatlash

---

**📅 Yaratilgan:** May 2024  
**👨‍💻 Muallif:** Mulkchi Dev Team  
**📧 Aloqa:** support@mulkchi.uz

---

> 🎉 **LOYIHA TO'LIQ TAYYOR!** Clean Architecture + Smart Analytics + Full Stack!
