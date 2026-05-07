# Mulkchi Platform Arxitekturasi

## 🏗️ Clean Architecture - 5 Qatlam

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PRESENTATION LAYER (Controllers)                           │
│     ┌──────────────────────────────────────────────────────┐   │
│     │  • AnalyticsController                                │   │
│     │  • PropertiesController                               │   │
│     │  • AIRecommendationsController                       │   │
│     │  └── HTTP Requests/Responses                        │   │
│     └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  2. SERVICE LAYER (Business Logic)                             │
│     ┌──────────────────────────────────────────────────────┐   │
│     │  • AnalyticsService                                 │   │
│     │    ├── Property Analysis Engine                     │   │
│     │    ├── Location Intelligence                      │   │
│     │    └── Price Intelligence                         │   │
│     │  • PropertyService                                  │   │
│     │  • AIRecommendationService                        │   │
│     └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  3. BROKER LAYER (Data Access)                                 │
│     ┌──────────────────────────────────────────────────────┐   │
│     │  • StorageBroker (Repository Pattern)               │   │
│     │    ├── Properties                                  │   │
│     │    ├── Users                                       │   │
│     │    └── Bookings                                    │   │
│     └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  4. DOMAIN LAYER (Models)                                      │
│     ┌──────────────────────────────────────────────────────┐   │
│     │  • Property                                         │   │
│     │  • User                                             │   │
│     │  • Booking                                          │   │
│     │  • Analytics Models                                 │   │
│     └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  5. INFRASTRUCTURE LAYER                                       │
│     ┌──────────────────────────────────────────────────────┐   │
│     │  • PostgreSQL Database                              │   │
│     │  • Entity Framework Core                          │   │
│     │  • ML.NET (AI/ML)                                   │   │
│     └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ PRESENTATION LAYER (Controllers)

**Vazifa:** HTTP so'rovlarni qabul qilish, validatsiya, response qaytarish

### AnalyticsController.cs
```csharp
[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    // Endpoint misol:
    [HttpGet("property-analysis/{propertyId}")]
    public async Task<ActionResult> AnalyzeProperty(Guid propertyId)
    {
        // 1. Service chaqiriladi
        var result = await _analyticsService.AnalyzePropertyAsync(propertyId);
        // 2. HTTP 200 OK qaytariladi
        return Ok(result);
    }
}
```

**API Endpointlar:**
- `GET /api/analytics/property-analysis/{id}` - Mulk tahlili
- `GET /api/analytics/smart-filters/best-deals` - Eng yaxshi takliflar
- `GET /api/analytics/location-score` - Hudud reytingi

---

## 2️⃣ SERVICE LAYER (Business Logic)

**Vazifa:** Biznes qoidalari, hisob-kitoblar, tahlillar

### AnalyticsService.cs
```csharp
public class AnalyticsService : IAnalyticsService
{
    private readonly StorageBroker _storageBroker;
    
    // 🧮 PROPERTY ANALYSIS ENGINE
    public async Task<PropertyAnalysisResult> AnalyzePropertyAsync(Guid propertyId)
    {
        // 1. Mulk ma'lumotlarini olish
        var property = await _storageBroker.Properties.FindAsync(propertyId);
        
        // 2. Bozor ma'lumotlarini olish
        var comparables = await GetComparableProperties(property.District);
        
        // 3. Narx tahlili
        var marketPrice = CalculateMarketPrice(comparables);
        var priceDiff = property.Price - marketPrice;
        
        // 4. Status aniqlash (Overpriced/Underpriced)
        var status = DeterminePriceStatus(priceDiff);
        
        // 5. Natija qaytarish
        return new PropertyAnalysisResult { ... };
    }
}
```

### Servislar:

| Service | Vazifasi |
|---------|----------|
| `AnalyticsService` | Narx tahlili, location intelligence |
| `PropertyService` | CRUD operatsiyalar |
| `AIRecommendationService` | ML-based tavsiyalar |
| `BookingService` | Bron qilish logikasi |

---

## 3️⃣ BROKER LAYER (Repository Pattern)

**Vazifa:** Ma'lumotlar bazasi bilan aloqa, query optimizatsiya

### StorageBroker.cs
```csharp
public class StorageBroker : EFxceptionsContext
{
    // DbSet - har bir jadval uchun
    public DbSet<Property> Properties { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    
    // CRUD operatsiyalar
    public async ValueTask<Property> InsertPropertyAsync(Property property)
    {
        await this.Properties.AddAsync(property);
        await this.SaveChangesAsync();
        return property;
    }
}
```

### Repository Pattern Afzalliklari:
- ✅ Test qilish oson
- ✅ Database almashtirish oson
- ✅ Query reuse
- ✅ Type safety

---

## 4️⃣ DOMAIN LAYER (Models)

**Vazifa:** Ma'lumotlar strukturasi, validation

### Property.cs (Entity)
```csharp
public class Property
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; }
    
    public decimal? SalePrice { get; set; }
    public decimal? MonthlyRent { get; set; }
    
    // Relationships
    public Guid HostId { get; set; }
    public User Host { get; set; }
    
    public List<PropertyImage> Images { get; set; }
}
```

### Analytics Models
```csharp
// Tahlil natijalari uchun
public class PropertyAnalysisResult
{
    public decimal CurrentPrice { get; set; }
    public decimal EstimatedMarketPrice { get; set; }
    public PriceStatus Status { get; set; } // Underpriced/Overpriced
    public double ValueScore { get; set; } // 0-100
}
```

---

## 5️⃣ INFRASTRUCTURE LAYER

**Vazifa:** Database, caching, external services

### PostgreSQL Database
```sql
-- Jadvallar strukturasi
CREATE TABLE Properties (
    Id UUID PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    SalePrice DECIMAL(18,2),
    District VARCHAR(100),
    Region VARCHAR(50),
    CreatedDate TIMESTAMP
);

CREATE INDEX IX_Properties_District ON Properties(District);
CREATE INDEX IX_Properties_Region ON Properties(Region);
```

### Entity Framework Core
```csharp
// Migration orqali avtomatik yaratish
public class CreatePropertiesTable : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Properties",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(200)", nullable: false),
                SalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true)
            });
    }
}
```

---

## 🔄 Data Flow (So'rov oqimi)

```
User Request
    ↓
[1. Controller]  ← HTTP GET /api/analytics/property-analysis/123
    ↓
[2. Service]     ← AnalyzePropertyAsync() chaqiradi
    ↓
[3. Broker]      ← SELECT * FROM Properties WHERE Id = 123
    ↓
[4. Database]    ← PostgreSQL query
    ↓
[3. Broker]      ← Data returns
    ↓
[2. Service]     ← Business logic (hisob-kitob)
    ↓
[1. Controller]  ← JSON response
    ↓
User Response
```

---

## 📊 Smart Analytics Arxitekturasi

```
┌────────────────────────────────────────────────┐
│           PROPERTY ANALYSIS ENGINE             │
├────────────────────────────────────────────────┤
│ Input: Property ID                           │
│                                                │
│ 1. Get Property Data ──→ StorageBroker       │
│ 2. Get Comparables   ──→ District Avg Query   │
│ 3. Feature Analysis  ──→ WiFi/Parking/AC      │
│ 4. Price Calculation ──→ Market Price ± Adj   │
│ 5. Status Determination ──→ Under/Over priced │
│                                                │
│ Output: PropertyAnalysisResult               │
│   ├── CurrentPrice: 500,000,000              │
│   ├── MarketPrice: 450,000,000               │
│   ├── Status: Overpriced (+11%)            │
│   └── ValueScore: 35/100                    │
└────────────────────────────────────────────────┘
```

---

## 🎯 Dependency Injection (DI)

```csharp
// Program.cs - DI Container
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<StorageBroker>();

// Controller da avtomatik inject
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    
    // Constructor orqali avtomatik olinadi
    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }
}
```

---

## 📁 Loyiha Strukturasi

```
Mulkchi.Api/
├── Controllers/           # 1. Presentation Layer
│   ├── AnalyticsController.cs
│   └── PropertiesController.cs
│
├── Services/              # 2. Service Layer
│   └── Foundations/
│       ├── Analytics/
│       │   ├── AnalyticsService.cs
│       │   └── IAnalyticsService.cs
│       └── Properties/
│
├── Brokers/               # 3. Broker Layer
│   └── Storages/
│       └── StorageBroker.cs
│
├── Models/                # 4. Domain Layer
│   ├── Foundations/
│   │   └── Properties/
│   │       └── Property.cs
│   └── Analytics/
│       └── PropertyAnalysisResult.cs
│
└── Migrations/            # 5. Infrastructure
    └── PostgreSQL scripts
```

---

## ✅ Afzalliklar

| Afzallik | Tavsifi |
|----------|---------|
| **Separation of Concerns** | Har bir qatlam faqat o'z vazifasini bajaradi |
| **Testability** | Har bir qatlam alohida test qilinadi |
| **Maintainability** | O'zgarishlar faqat bir qatlamda |
| **Scalability** | Servislar alohida scale qilinadi |

---

**Joyme.uz dan farqi:**
- ❌ Joyme: Monolithic, faqat listing
- ✅ Mulkchi: Layered + Smart Analytics + AI
