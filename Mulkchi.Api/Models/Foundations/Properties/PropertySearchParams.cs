namespace Mulkchi.Api.Models.Foundations.Properties;

public class PropertySearchParams
{
    public string? SearchQuery { get; set; }
    public string? Region { get; set; }
    public string? City { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public ListingType? ListingType { get; set; }
    public PropertyType? PropertyType { get; set; }
    public int? Bedrooms { get; set; }
    public bool? HasWifi { get; set; }
    public bool? HasParking { get; set; }
    public bool? HasPool { get; set; }
    public bool? IsVerified { get; set; }
    public string? SortBy { get; set; } // "price_asc", "price_desc", "newest", "rating"
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? RadiusKm { get; set; }
}
