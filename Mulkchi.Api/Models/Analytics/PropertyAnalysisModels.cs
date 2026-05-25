namespace Mulkchi.Api.Services.Foundations.Analytics;

/// <summary>
/// Property Analysis Result - overpriced/underpriced detection
/// </summary>
public class PropertyAnalysisResult
{
    public Guid PropertyId { get; set; }
    public string PropertyTitle { get; set; } = string.Empty;

    // Price Analysis
    public decimal CurrentPrice { get; set; }
    public decimal EstimatedMarketPrice { get; set; }
    public decimal PriceDifference { get; set; }
    public double PriceDifferencePercent { get; set; }
    public PriceStatus Status { get; set; }
    public string StatusDescription => Status.ToString();

    // Market Comparison
    public decimal DistrictAveragePrice { get; set; }
    public decimal DistrictMedianPrice { get; set; }
    public decimal DistrictPricePerSqm { get; set; }
    public int ComparablePropertiesCount { get; set; }

    // Value Metrics
    public double ValueScore { get; set; } // 0-100
    public double InvestmentPotential { get; set; } // 0-100
    public string Recommendation { get; set; } = string.Empty;

    // Risk Assessment
    public double RiskScore { get; set; } // 0-100 (lower is better)
    public List<string> RiskFactors { get; set; } = new();
    public List<string> PositiveFactors { get; set; } = new();
}

public enum PriceStatus
{
    SignificantlyUnderpriced, // > 20% below market
    Underpriced,             // 10-20% below market
    FairPrice,               // +/- 10% of market
    Overpriced,              // 10-20% above market
    SignificantlyOverpriced  // > 20% above market
}

/// <summary>
/// Property Deal Score for smart filtering
/// </summary>
public class PropertyDealScore
{
    public Guid PropertyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal EstimatedValue { get; set; }
    public double DealScore { get; set; } // 0-100
    public double DiscountPercent { get; set; }
    public double RoiEstimate { get; set; } // Annual ROI %
    public string DealType { get; set; } = string.Empty; // "BestDeal", "HighROI", "FastSelling"
    public List<string> Reasons { get; set; } = new();
}

/// <summary>
/// Location Score and Intelligence
/// </summary>
public class LocationScore
{
    public string Region { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public double OverallScore { get; set; } // 0-100

    // Category Scores
    public double AffordabilityScore { get; set; } // Narx qulayligi
    public double GrowthPotentialScore { get; set; } // O'sish potensiali
    public double InfrastructureScore { get; set; } // Infratuzilma
    public double SafetyScore { get; set; } // Xavfsizlik
    public double ConnectivityScore { get; set; } // Transport bog'liqligi
    public double AmenitiesScore { get; set; } // Qulayliklar

    public string Verdict { get; set; } = string.Empty;
    public string InvestmentOutlook { get; set; } = string.Empty;
}

public class LocationInsight
{
    public string Type { get; set; } = string.Empty; // "Pro", "Con", "Fact"
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ImpactScore { get; set; } // -10 to +10
}

/// <summary>
/// Price Prediction Models
/// </summary>
public class PricePrediction
{
    public Guid PropertyId { get; set; }
    public decimal PredictedPrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public double Confidence { get; set; } // 0-100
    public string PredictionBasis { get; set; } = string.Empty;
    public List<PriceFactor> Factors { get; set; } = new();
}

public class PriceFactor
{
    public string Name { get; set; } = string.Empty;
    public double Impact { get; set; } // Positive or negative impact on price
    public string Description { get; set; } = string.Empty;
}

public class PriceTrendForecast
{
    public string Region { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public List<MonthlyForecast> Forecasts { get; set; } = new();
    public double OverallTrendPercent { get; set; }
    public string TrendDirection { get; set; } = string.Empty; // "Rising", "Stable", "Falling"
    public string Recommendation { get; set; } = string.Empty;
}

public class MonthlyForecast
{
    public string Month { get; set; } = string.Empty;
    public decimal PredictedAvgPrice { get; set; }
    public double ChangePercent { get; set; }
    public double Confidence { get; set; }
}
