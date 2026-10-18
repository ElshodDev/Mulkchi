namespace Mulkchi.Api.Models.Foundations.Analytics;

public class MarketOverview
{
    public int TotalListings { get; set; }
    public int TotalForSale { get; set; }
    public int TotalForRent { get; set; }
    public decimal AverageSalePrice { get; set; }
    public decimal AverageRentPrice { get; set; }
    public string MostActiveCity { get; set; } = string.Empty;
    public int NewListingsToday { get; set; }
    public string TopCity { get; set; } = string.Empty;
    public int TopCityCount { get; set; }
    public int NewListingsYesterday { get; set; }
    public int AvgNewListingsPerDay { get; set; }
    public decimal AveragePricePerSqm { get; set; }
    public decimal PriceChangePercent { get; set; }
    public System.DateTimeOffset LastUpdated { get; set; }
}

public class RegionAnalytics
{
    public string Region { get; set; } = string.Empty;
    public int ListingsCount { get; set; }
    public decimal AverageSalePrice { get; set; }
    public decimal AverageRentPrice { get; set; }
}

public class DistrictAnalytics
{
    public string Region { get; set; } = string.Empty;
    public string? District { get; set; }
    public int ListingsCount { get; set; }
    public decimal AverageSalePrice { get; set; }
    public decimal AverageRentPrice { get; set; }
    public decimal MinSalePrice { get; set; }
    public decimal MaxSalePrice { get; set; }
    public decimal MinRentPrice { get; set; }
    public decimal MaxRentPrice { get; set; }
    public decimal PricePerSqm { get; set; }
}

public class PriceTrend
{
    public string Month { get; set; } = string.Empty;
    public decimal AveragePrice { get; set; }
    public int ListingsCount { get; set; }
}
