using Mulkchi.Api.Models.Foundations.Common;

namespace Mulkchi.Api.Models.Foundations.Properties
{
    public class PropertyQueryParams
    {
        public string? City { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? Bedrooms { get; set; }
        public UzbekistanRegion? Region { get; set; }
        public ListingType? ListingType { get; set; }
        public Currency? Currency { get; set; }
        public PropertyType? PropertyType { get; set; }

        public string? SearchQuery { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = true;
        public string? Status { get; set; }
        public bool? HasWifi { get; set; }
        public bool? HasParking { get; set; }
        public bool? HasPool { get; set; }
        public bool? PetsAllowed { get; set; }
        public bool? IsInstantBook { get; set; }
        public double? MinArea { get; set; }
        public double? MaxArea { get; set; }
        public int? MaxGuests { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}