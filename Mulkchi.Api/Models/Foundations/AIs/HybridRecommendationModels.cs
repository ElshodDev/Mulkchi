namespace Mulkchi.Api.Models.Foundations.AIs;

public class HybridRecommendationRequest
{
    public Guid? UserId { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double RadiusKm { get; set; } = 10;
    public int Limit { get; set; } = 10;
}

public class HybridRecommendationProperty
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public string ListingType { get; set; } = string.Empty;
    public double Area { get; set; }
    public int RoomsCount { get; set; }
    public int BathroomsCount { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
    public Guid HostId { get; set; }
    public string HostName { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public int ReviewsCount { get; set; }
    public int ViewsCount { get; set; }
    public double? DistanceKm { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsVerified { get; set; }
}

public class HybridRecommendationResponse
{
    public string Id { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public Guid PropertyId { get; set; }
    public string RecommendationType { get; set; } = "PreferenceBased";
    public string AbVariant { get; set; } = "A";
    public decimal Score { get; set; }
    public string Reason { get; set; } = string.Empty;
    public HybridRecommendationProperty Property { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public bool IsViewed { get; set; }
    public bool IsClicked { get; set; }
}
