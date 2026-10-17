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
    public string? District { get; set; }
    public bool? HasWifi { get; set; }
    public bool? HasParking { get; set; }
    public bool? HasPool { get; set; }
    public bool? HasMetroNearby { get; set; }
    public bool? HasFurniture { get; set; }
    public bool? IsRenovated { get; set; }
    public RenovationLevel? RenovationLevel { get; set; }
    public bool? IsVerified { get; set; }
    public string? SortBy { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? RadiusKm { get; set; }
}
