using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Analytics;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<DistrictStat> DistrictStats { get; set; }
    public DbSet<MarketTrend> MarketTrends { get; set; }
    public DbSet<PriceHistory> PriceHistories { get; set; }

    private static void ConfigureAnalytics(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DistrictStat>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Region, e.District })
                  .IsUnique()
                  .HasDatabaseName("IX_DistrictStats_Region_District");
            entity.HasIndex(e => e.CalculatedAt)
                  .HasDatabaseName("IX_DistrictStats_CalculatedAt");
            entity.HasIndex(e => e.OverallScore)
                  .HasDatabaseName("IX_DistrictStats_OverallScore");
        });

        modelBuilder.Entity<MarketTrend>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Region, e.District, e.PropertyType, e.YearMonth })
                  .IsUnique()
                  .HasDatabaseName("IX_MarketTrends_Region_District_PropertyType_YearMonth");
            entity.HasIndex(e => e.CalculatedAt)
                  .HasDatabaseName("IX_MarketTrends_CalculatedAt");
        });

        modelBuilder.Entity<PriceHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PropertyId)
                  .HasDatabaseName("IX_PriceHistories_PropertyId");
            entity.HasIndex(e => e.RecordedDate)
                  .HasDatabaseName("IX_PriceHistories_RecordedDate");
        });
    }
}
