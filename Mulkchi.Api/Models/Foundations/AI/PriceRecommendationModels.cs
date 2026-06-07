using Microsoft.ML.Data;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Models.Foundations.AI;

public class PropertyPriceInput
{
    [LoadColumn(0)]
    public float Area { get; set; }

    [LoadColumn(1)]
    public float Bedrooms { get; set; }

    [LoadColumn(2)]
    public float Bathrooms { get; set; }

    [LoadColumn(3)]
    public float Region { get; set; }

    [LoadColumn(4)]
    public float HasWifi { get; set; }

    [LoadColumn(5)]
    public float HasParking { get; set; }

    [LoadColumn(6)]
    public float HasPool { get; set; }

    [LoadColumn(7)]
    public float IsRenovated { get; set; }

    [LoadColumn(8)]
    public float HasElevator { get; set; }

    [LoadColumn(9)]
    public float DistanceToCityCenter { get; set; }

    [LoadColumn(10)]
    public float ListingType { get; set; } // 0 = Sale, 1 = Rent

    [LoadColumn(11)]
    public string DescriptionText { get; set; } = string.Empty; // NLP Feature

    [LoadColumn(12)]
    public string District { get; set; } = string.Empty; // NLP Feature for District

    [LoadColumn(13)]
    public float BuildingType { get; set; } // 0 = Old, 1 = New

    [LoadColumn(14)]
    public float RenovationLevel { get; set; } // 0 = Korobka, 1 = Average, 2 = EuroLux

    [LoadColumn(15)]
    public float Label { get; set; }
}

public class PropertyPricePrediction
{
    [ColumnName("Score")]
    public float PredictedPrice { get; set; }
}

public class PriceRecommendationRequest
{
    public float Area { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public int Region { get; set; }
    public bool HasWifi { get; set; }
    public bool HasParking { get; set; }
    public bool HasPool { get; set; }
    public bool IsRenovated { get; set; }
    public bool HasElevator { get; set; }
    public float DistanceToCityCenter { get; set; }
    public string District { get; set; } = string.Empty;
    public BuildingType BuildingType { get; set; }
    public RenovationLevel RenovationLevel { get; set; }
    public ListingType ListingType { get; set; }
    public string DescriptionText { get; set; } = string.Empty;
}

public class PriceRecommendationResponse
{
    public decimal PredictedPrice { get; set; }
    public string Currency { get; set; } = "USD";
    public string Confidence { get; set; } = "Low";
    public PriceRange PriceRange { get; set; } = new();
    public int BasedOnProperties { get; set; }
    public string Recommendation { get; set; } = string.Empty;
    public bool IsRuleBased { get; set; }
}

public class PriceRange
{
    public decimal Min { get; set; }
    public decimal Max { get; set; }
}

public class PricePredictionRequest
{
    public string Region { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public int NumberOfRooms { get; set; }
    public decimal Area { get; set; }
    public string ListingType { get; set; } = string.Empty;
}
