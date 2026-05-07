using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Analytics;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    // Analytics tables for smart real estate platform
    
    /// <summary>
    /// Historical price data for trend analysis
    /// </summary>
    public DbSet<PriceHistory> PriceHistories { get; set; }
    
    /// <summary>
    /// Pre-calculated market trends by region/district
    /// </summary>
    public DbSet<MarketTrend> MarketTrends { get; set; }
    
    /// <summary>
    /// Pre-calculated district statistics
    /// </summary>
    public DbSet<DistrictStat> DistrictStats { get; set; }

    private void ConfigureAnalytics(ModelBuilder modelBuilder)
    {
        // PriceHistory indexes
        modelBuilder.Entity<PriceHistory>()
            .HasIndex(ph => new { ph.PropertyId, ph.RecordedDate })
            .HasDatabaseName("IX_PriceHistories_PropertyId_RecordedDate");

        modelBuilder.Entity<PriceHistory>()
            .HasIndex(ph => ph.RecordedDate)
            .HasDatabaseName("IX_PriceHistories_RecordedDate");

        // MarketTrend indexes
        modelBuilder.Entity<MarketTrend>()
            .HasIndex(mt => new { mt.Region, mt.District, mt.YearMonth })
            .HasDatabaseName("IX_MarketTrends_Region_District_YearMonth")
            .IsUnique();

        modelBuilder.Entity<MarketTrend>()
            .HasIndex(mt => mt.YearMonth)
            .HasDatabaseName("IX_MarketTrends_YearMonth");

        // DistrictStat indexes
        modelBuilder.Entity<DistrictStat>()
            .HasIndex(ds => new { ds.Region, ds.District })
            .HasDatabaseName("IX_DistrictStats_Region_District")
            .IsUnique();

        modelBuilder.Entity<DistrictStat>()
            .HasIndex(ds => ds.CalculatedAt)
            .HasDatabaseName("IX_DistrictStats_CalculatedAt");

        modelBuilder.Entity<DistrictStat>()
            .HasIndex(ds => ds.OverallScore)
            .HasDatabaseName("IX_DistrictStats_OverallScore");
    }
}
