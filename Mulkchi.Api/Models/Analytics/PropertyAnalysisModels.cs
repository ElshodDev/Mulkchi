namespace Mulkchi.Api.Services.Foundations.Analytics;

public class PropertyAnalysisResult
{
    public Guid PropertyId { get; set; }
    public string PropertyTitle { get; set; } = string.Empty;

    public decimal CurrentPrice { get; set; }
    public decimal EstimatedMarketPrice { get; set; }
    public decimal PriceDifference { get; set; }
    public double PriceDifferencePercent { get; set; }
    public PriceStatus Status { get; set; }
    public string StatusDescription => Status.ToString();

    public decimal DistrictAveragePrice { get; set; }
    public decimal DistrictMedianPrice { get; set; }
    public decimal DistrictPricePerSqm { get; set; }
    public int ComparablePropertiesCount { get; set; }

    public double ValueScore { get; set; }
    public double InvestmentPotential { get; set; }
    public string Recommendation { get; set; } = string.Empty;

    public double RiskScore { get; set; }
    public List<string> RiskFactors { get; set; } = new();
    public List<string> PositiveFactors { get; set; } = new();
}

public enum PriceStatus
{
    SignificantlyUnderpriced,
    Underpriced,            
    FairPrice,              
    Overpriced,             
    SignificantlyOverpriced 
}

public class PropertyDealScore
{
    public Guid PropertyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal EstimatedValue { get; set; }
    public double DealScore { get; set; }
    public double DiscountPercent { get; set; }
    public double RoiEstimate { get; set; }
    public string DealType { get; set; } = string.Empty;
    public List<string> Reasons { get; set; } = new();
}

public class LocationScore
{
    public string Region { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public double OverallScore { get; set; }

    public double AffordabilityScore { get; set; }
    public double GrowthPotentialScore { get; set; }
    public double InfrastructureScore { get; set; }
    public double SafetyScore { get; set; }
    public double ConnectivityScore { get; set; }
    public double AmenitiesScore { get; set; }

    public string Verdict { get; set; } = string.Empty;
    public string InvestmentOutlook { get; set; } = string.Empty;
}

public class LocationInsight
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ImpactScore { get; set; }
}

public class PricePrediction
{
    public Guid PropertyId { get; set; }
    public decimal PredictedPrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public double Confidence { get; set; }
    public string PredictionBasis { get; set; } = string.Empty;
    public List<PriceFactor> Factors { get; set; } = new();
}

public class PriceFactor
{
    public string Name { get; set; } = string.Empty;
    public double Impact { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class PriceTrendForecast
{
    public string Region { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public List<MonthlyForecast> Forecasts { get; set; } = new();
    public double OverallTrendPercent { get; set; }
    public string TrendDirection { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
}

public class MonthlyForecast
{
    public string Month { get; set; } = string.Empty;
    public decimal PredictedAvgPrice { get; set; }
    public double ChangePercent { get; set; }
    public double Confidence { get; set; }
}
