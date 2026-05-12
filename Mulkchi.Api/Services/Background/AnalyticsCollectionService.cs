using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Analytics;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Background;

/// <summary>
/// Background service for collecting and updating analytics data
/// Runs periodically to pre-calculate statistics
/// </summary>
public class AnalyticsCollectionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AnalyticsCollectionService> _logger;

    public AnalyticsCollectionService(
        IServiceProvider serviceProvider,
        ILogger<AnalyticsCollectionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Analytics Collection Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var broker = scope.ServiceProvider.GetRequiredService<StorageBroker>();

                // Collect price history for properties that changed price
                await CollectPriceHistoryAsync(broker, stoppingToken);

                // Update market trends for current month
                await UpdateMarketTrendsAsync(broker, stoppingToken);

                // Update district statistics
                await UpdateDistrictStatsAsync(broker, stoppingToken);

                _logger.LogInformation("Analytics data collection completed at {Time}", DateTimeOffset.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in analytics collection");
            }

            // Run every 6 hours
            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    /// <summary>
    /// Record price changes in history table
    /// </summary>
    private async Task CollectPriceHistoryAsync(StorageBroker broker, CancellationToken ct)
    {
        try
        {
            var recentProperties = await broker.Properties
                .Where(p => !p.DeletedDate.HasValue)
                .Where(p => p.UpdatedDate > DateTimeOffset.UtcNow.AddDays(-1))
                .Where(p => p.SalePrice.HasValue || p.MonthlyRent.HasValue)
                .ToListAsync(ct);

            var addedCount = 0;
            foreach (var property in recentProperties)
            {
                try
                {
                    // Check if we already recorded this price today
                    var existing = await broker.PriceHistories
                        .IgnoreQueryFilters() // Ignore soft delete filters for check
                        .Where(ph => ph.PropertyId == property.Id)
                        .Where(ph => ph.RecordedDate >= DateTimeOffset.UtcNow.Date)
                        .FirstOrDefaultAsync(ct);

                    if (existing == null)
                    {
                        var price = property.SalePrice ?? property.MonthlyRent ?? 0;
                        if (price <= 0) continue;

                        var type = property.SalePrice.HasValue ? PriceType.Sale : PriceType.MonthlyRent;

                        var history = new PriceHistory
                        {
                            PropertyId = property.Id,
                            Price = price,
                            Type = type,
                            RecordedDate = DateTimeOffset.UtcNow,
                            Source = "AutoCollection"
                        };

                        await broker.PriceHistories.AddAsync(history, ct);
                        addedCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to record price history for property {PropertyId}", property.Id);
                }
            }

            if (addedCount > 0)
            {
                await broker.SaveChangesAsync(ct);
            }
            
            _logger.LogInformation("Collected price history for {Count} properties (added {Added})", recentProperties.Count, addedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error collecting price history");
        }
    }

    /// <summary>
    /// Calculate and update market trends by district
    /// </summary>
    private async Task UpdateMarketTrendsAsync(StorageBroker broker, CancellationToken ct)
    {
        var currentMonth = DateTimeOffset.UtcNow.ToString("yyyy-MM");
        
        // Get all regions and districts
        var locations = await broker.Properties
            .Where(p => !p.DeletedDate.HasValue)
            .Where(p => !string.IsNullOrEmpty(p.District))
            .Select(p => new { p.Region, p.District, p.Type })
            .Distinct()
            .ToListAsync(ct);

        foreach (var location in locations)
        {
            var regionString = location.Region.ToString();
            var district = location.District;
            var propertyType = location.Type.ToString();

            // Calculate stats for this location
            var properties = broker.Properties
                .Where(p => !p.DeletedDate.HasValue)
                .Where(p => p.Region == location.Region && p.District == district)
                .Where(p => p.Type == location.Type);

            var avgSale = await properties
                .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                .AverageAsync(p => (decimal?)p.SalePrice) ?? 0;

            var avgRent = await properties
                .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                .AverageAsync(p => (decimal?)p.MonthlyRent) ?? 0;

            var listingsCount = await properties.CountAsync(ct);

            var pricePerSqm = await properties
                .Where(p => p.SalePrice.HasValue && p.SalePrice > 0 && p.Area > 0)
                .Select(p => p.SalePrice.GetValueOrDefault() / (decimal)p.Area)
                .AverageAsync(p => (decimal?)p) ?? 0;

            // Calculate price change from previous month
            var prevMonth = DateTimeOffset.UtcNow.AddMonths(-1).ToString("yyyy-MM");
            var prevTrend = await broker.MarketTrends
                .Where(mt => mt.Region == regionString && mt.District == district)
                .Where(mt => mt.PropertyType == propertyType)
                .Where(mt => mt.YearMonth == prevMonth)
                .FirstOrDefaultAsync(ct);

            var priceChange = prevTrend != null && prevTrend.AverageSalePrice > 0
                ? (double)((avgSale - prevTrend.AverageSalePrice) / prevTrend.AverageSalePrice * 100)
                : 0;

            // Determine market sentiment
            var sentiment = priceChange switch
            {
                > 10 => "Hot",
                > 5 => "Warm",
                < -10 => "Cold",
                < -5 => "Cool",
                _ => "Stable"
            };

            // Upsert market trend
            var existing = await broker.MarketTrends
                .Where(mt => mt.Region == regionString && mt.District == district)
                .Where(mt => mt.PropertyType == propertyType)
                .Where(mt => mt.YearMonth == currentMonth)
                .FirstOrDefaultAsync(ct);

            if (existing != null)
            {
                existing.AverageSalePrice = avgSale;
                existing.AverageRentPrice = avgRent;
                existing.PricePerSqm = pricePerSqm;
                existing.ListingsCount = listingsCount;
                existing.PriceChangePercent = priceChange;
                existing.MarketSentiment = sentiment;
                existing.CalculatedAt = DateTimeOffset.UtcNow;
                existing.DataPointsUsed = listingsCount;
            }
            else
            {
                var trend = new MarketTrend
                {
                    Region = regionString,
                    District = district,
                    PropertyType = propertyType,
                    YearMonth = currentMonth,
                    AverageSalePrice = avgSale,
                    AverageRentPrice = avgRent,
                    PricePerSqm = pricePerSqm,
                    ListingsCount = listingsCount,
                    PriceChangePercent = priceChange,
                    MarketSentiment = sentiment,
                    CalculatedAt = DateTimeOffset.UtcNow,
                    DataPointsUsed = listingsCount
                };
                await broker.MarketTrends.AddAsync(trend, ct);
            }
        }

        try
        {
            await broker.SaveChangesAsync(ct);
            _logger.LogInformation("Updated market trends for {Count} locations", locations.Count);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key") == true)
        {
            _logger.LogWarning("Duplicate key conflict in MarketTrends, skipping: {Message}", ex.InnerException?.Message);
            // Entry ni detach qilish
            foreach (var entry in broker.ChangeTracker.Entries().ToList())
            {
                entry.State = EntityState.Detached;
            }
        }
    }

    /// <summary>
    /// Calculate and update district statistics
    /// </summary>
    private async Task UpdateDistrictStatsAsync(StorageBroker broker, CancellationToken ct)
    {
        var districts = await broker.Properties
            .Where(p => !p.DeletedDate.HasValue)
            .Where(p => !string.IsNullOrEmpty(p.District))
            .Select(p => new { p.Region, p.District })
            .Distinct()
            .ToListAsync(ct);

        foreach (var loc in districts)
        {
            var regionString = loc.Region.ToString();
            var district = loc.District;

            var properties = await broker.Properties
                .Where(p => !p.DeletedDate.HasValue)
                .Where(p => p.Region == loc.Region && p.District == district)
                .ToListAsync(ct);

            if (!properties.Any()) continue;

            // Price statistics
            var salePrices = properties.Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                .Select(p => p.SalePrice.GetValueOrDefault())
                .OrderBy(p => p)
                .ToList();

            var avgPrice = salePrices.Any() ? salePrices.Average() : 0;
            var minPrice = salePrices.Any() ? salePrices.Min() : 0;
            var maxPrice = salePrices.Any() ? salePrices.Max() : 0;
            var medianPrice = salePrices.Any() ? salePrices[salePrices.Count / 2] : 0;

            var q25 = salePrices.Any() ? salePrices[salePrices.Count / 4] : 0;
            var q75 = salePrices.Any() ? salePrices[(salePrices.Count * 3) / 4] : 0;

            var rentPrices = properties.Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                .Select(p => p.MonthlyRent.GetValueOrDefault())
                .ToList();

            var avgRent = rentPrices.Any() ? rentPrices.Average() : 0;
            var rentalYield = avgPrice > 0 ? (avgRent * 12 / avgPrice * 100) : 0;

            // Count by type
            var apartmentCount = properties.Count(p => p.Type == PropertyType.Apartment);
            var houseCount = properties.Count(p => p.Type == PropertyType.House);
            var commercialCount = properties.Count(p => p.Type == PropertyType.Commercial);
            var landCount = properties.Count(p => p.Type == PropertyType.Land);

            // Amenities coverage
            var wifiPct = (double)properties.Count(p => p.HasWifi) / properties.Count * 100;
            var parkingPct = (double)properties.Count(p => p.HasParking) / properties.Count * 100;
            var metroPct = (double)properties.Count(p => p.HasMetroNearby) / properties.Count * 100;
            var schoolPct = (double)properties.Count(p => p.HasSchoolNearby) / properties.Count * 100;
            var marketPct = (double)properties.Count(p => p.HasMarketNearby) / properties.Count * 100;
            var hospitalPct = (double)properties.Count(p => p.HasHospitalNearby) / properties.Count * 100;

            // Calculate scores
            var avgRating = properties.Average(p => p.AverageRating);
            var affordabilityScore = (decimal)Math.Max(0, 100 - (double)(avgPrice / 10000000m)); // 100M = 0 score
            var infrastructureScore = (decimal)((wifiPct + parkingPct) / 2);
            var connectivityScore = (decimal)((metroPct * 1.5 + (double)properties.Count(p => p.HasBusStop) / properties.Count * 100) / 2.5);
            var amenitiesScore = (decimal)((marketPct + schoolPct + hospitalPct) / 3);
            var safetyScore = (decimal)((double)avgRating * 20);
            var growthScore = (decimal)Math.Min(100, properties.Average(p => p.ViewsCount) / 5);
            var investmentPotential = (growthScore + rentalYield * 5) / 2;

            var overallScore = (affordabilityScore + infrastructureScore + connectivityScore +
                               amenitiesScore + safetyScore + growthScore) / 6;

            // Upsert district stat
            var existing = await broker.DistrictStats
                .Where(ds => ds.Region == regionString && ds.District == district)
                .FirstOrDefaultAsync(ct);

            if (existing != null)
            {
                existing.AverageSalePrice = avgPrice;
                existing.MedianSalePrice = medianPrice;
                existing.MinSalePrice = minPrice;
                existing.MaxSalePrice = maxPrice;
                existing.PriceQuartile25 = q25;
                existing.PriceQuartile75 = q75;
                existing.PricePerSqm = salePrices.Any() && properties.Any(p => p.Area > 0)
                    ? salePrices.Sum() / properties.Where(p => p.Area > 0).Sum(p => (decimal)p.Area)
                    : 0;
                existing.AverageRentPrice = avgRent;
                existing.RentalYieldPercent = rentalYield;
                existing.TotalListings = properties.Count;
                existing.ApartmentCount = apartmentCount;
                existing.HouseCount = houseCount;
                existing.CommercialCount = commercialCount;
                existing.LandCount = landCount;
                existing.OverallScore = overallScore;
                existing.AffordabilityScore = affordabilityScore;
                existing.InfrastructureScore = infrastructureScore;
                existing.ConnectivityScore = connectivityScore;
                existing.AmenitiesScore = amenitiesScore;
                existing.SafetyScore = safetyScore;
                existing.InvestmentPotentialScore = investmentPotential;
                existing.GrowthScore = growthScore;
                existing.WifiCoveragePercent = wifiPct;
                existing.ParkingCoveragePercent = parkingPct;
                existing.MetroCoveragePercent = metroPct;
                existing.SchoolCoveragePercent = schoolPct;
                existing.MarketCoveragePercent = marketPct;
                existing.HospitalCoveragePercent = hospitalPct;
                existing.CalculatedAt = DateTimeOffset.UtcNow;
                existing.Summary = $"{district}: {properties.Count} listings, avg {avgPrice:N0} so'm, score {overallScore:F1}/100";
            }
            else
            {
                var stat = new DistrictStat
                {
                    Region = regionString,
                    District = district,
                    AverageSalePrice = avgPrice,
                    MedianSalePrice = medianPrice,
                    MinSalePrice = minPrice,
                    MaxSalePrice = maxPrice,
                    PriceQuartile25 = q25,
                    PriceQuartile75 = q75,
                    PricePerSqm = salePrices.Any() && properties.Any(p => p.Area > 0)
                        ? salePrices.Sum() / properties.Where(p => p.Area > 0).Sum(p => (decimal)p.Area)
                        : 0,
                    AverageRentPrice = avgRent,
                    RentalYieldPercent = rentalYield,
                    TotalListings = properties.Count,
                    ApartmentCount = apartmentCount,
                    HouseCount = houseCount,
                    CommercialCount = commercialCount,
                    LandCount = landCount,
                    OverallScore = overallScore,
                    AffordabilityScore = affordabilityScore,
                    InfrastructureScore = infrastructureScore,
                    ConnectivityScore = connectivityScore,
                    AmenitiesScore = amenitiesScore,
                    SafetyScore = safetyScore,
                    InvestmentPotentialScore = investmentPotential,
                    GrowthScore = growthScore,
                    WifiCoveragePercent = wifiPct,
                    ParkingCoveragePercent = parkingPct,
                    MetroCoveragePercent = metroPct,
                    SchoolCoveragePercent = schoolPct,
                    MarketCoveragePercent = marketPct,
                    HospitalCoveragePercent = hospitalPct,
                    Summary = $"{district}: {properties.Count} listings, avg {avgPrice:N0} so'm, score {overallScore:F1}/100"
                };
                await broker.DistrictStats.AddAsync(stat, ct);
            }
        }

        await broker.SaveChangesAsync(ct);
        _logger.LogInformation("Updated district stats for {Count} districts", districts.Count);
    }
}
