# Mulkchi

Mulkchi — ko‘chmas mulk uchun full-stack platforma: `ASP.NET Core Web API` + `Angular`.

## Stack

- **Backend:** .NET 9, ASP.NET Core, EF Core (SQL Server), SignalR, ML.NET
- **Frontend:** Angular 20, Angular Material, RxJS, Chart.js, Leaflet
- **Xavfsizlik:** JWT (httpOnly cookie), rate limiting, CORS, security headers
- **Qo‘shimcha:** Serilog logging, health checks, localization (`uz`, `ru`, `en`)

## Repository tuzilmasi

- `Mulkchi.Api` — backend API
- `Mulkchi.Frontend` — Angular ilova
- `Mulkchi.Api.Tests.Unit` — backend unit testlar
- `Mulkchi.Api.Infrastructure.Build` — infra/build utilitar loyiha
- `Mulkchi.sln` — asosiy solution
- `start-services.ps1` — local dev servislarini birga ishga tushirish skripti

## Backendda nimalar bor

Asosiy funksional modullar (`Controllers` bo‘yicha):

- Auth: `AuthController`
- Users: `UsersController`
- Properties: `PropertiesController`, `PropertyImagesController`, `PropertyImagesUploadController`, `PropertyViewsController`, `CompareController`
- Bookings: `BookingsController`
- Payments: `PaymentsController`, `PaymeController`, `ClickController`
- Communication: `MessagesController`, `ChatController`, `NotificationsController`, `SseNotificationsController`
- Recommendation/AI: `AiRecommendationsController`
- Analytics: `AnalyticsController`
- Qo‘shimcha biznes modullar: `FavoritesController`, `SavedSearchesController`, `ReviewsController`, `AnnouncementsController`, `DiscountsController`, `DiscountUsagesController`, `BoostsController`, `SubscriptionsController`, `HomeRequestsController`, `RentalContractsController`, `AmenitiesController`, `GeoController`

Texnik jihatlar:

- `ChatHub` va `NotificationHub` (`/hubs/chat`, `/hubs/notifications`)
- Health checks: `/health`, `/health/database`, `/health/file-storage`
- Startup’da migration avtomatik qo‘llanadi
- `ResponseCaching` va `IMemoryCache` ishlatiladi
- `FluentValidation`, `MailKit`, `BCrypt`, `Serilog` integratsiyalangan

## Frontendda nimalar bor

Asosiy route/featurelar:

- Public: home, properties list/detail, AI recommendations, market analytics, property compare
- Auth: login, register, forgot-password
- User: profile, bookings, favorites, messages, AI price prediction
- Host: host properties, host bookings, create/edit listing
- Admin: admin dashboard
- Error page: not-found

Frontend servislaridan asosiylari:

- `auth.service`, `property.service`, `chat.service`, `notifications.service`
- `ai.service`, `analytics.service`, `comparison.service`, `toast.service`
- JWT interceptor va route guardlar (`authGuard`, `hostGuard`, `adminGuard`)

## Local ishga tushirish

### 1) Talablar

- .NET SDK 9
- Node.js 20+
- SQL Server

### 2) Backend

```bash
dotnet restore Mulkchi.sln
```

JWT secret majburiy (`Mulkchi.Api/appsettings.json` da bo‘sh):

```bash
cd Mulkchi.Api
dotnet user-secrets init
dotnet user-secrets set "JwtSettings:Secret" "kamida-32-belgili-maxfiy-kalit"
```

Ishga tushirish:

```bash
dotnet run --project Mulkchi.Api
```

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`

### 3) Frontend

```bash
cd Mulkchi.Frontend
npm install
npm start
```

- Frontend: `http://localhost:4200`
- `proxy.conf.js` orqali `/api` va `/hubs` `http://localhost:5000` ga proxy qilinadi

### 4) Windows uchun tez start (ixtiyoriy)

PowerShell:

```powershell
.\start-services.ps1
```

Monitoring bilan:

```powershell
.\start-services.ps1 -Monitor
```

## Konfiguratsiya

Backend:

- `Mulkchi.Api/appsettings.json`
  - `ConnectionStrings:DefaultConnection`
  - `JwtSettings` (Secret/Issuer/Audience/ExpiryMinutes)
  - `EmailSettings`, `SmsSettings`
  - `Payme`, `Click`
  - `RateLimiting`
  - `AllowedOrigins`

Frontend:

- `Mulkchi.Frontend/src/environments/environment.development.ts`
  - `apiUrl`
  - `signalRUrl`
  - `frontendUrl`
  - `googleClientId`

## Test va build

Backend:

```bash
dotnet build Mulkchi.sln -c Release
dotnet test Mulkchi.sln -c Release
```

Frontend:

```bash
cd Mulkchi.Frontend
npm run build
npm run test:ci
npm run lint
```

## Muhim eslatmalar

- `JwtSettings:Secret` bo‘lmasa backend ishga tushmaydi.
- Frontend va backend default portlari bu repoda `4200` va `5000`.
- Docker fayllari hozirgi repoda aktiv ishlatilmayapti (o‘chirib tashlangan).

## Litsenziya

MIT — [LICENSE](LICENSE)
