#nullable disable

using Mulkchi.Api.Models.Foundations.PropertyImages;

namespace Mulkchi.Api.Models.Foundations.Properties;

public class Property
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public PropertyType Type { get; set; }
    public PropertyCategory Category { get; set; }
    public PropertyStatus Status { get; set; }
    public ListingType ListingType { get; set; }
    public decimal? MonthlyRent { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? PricePerNight { get; set; }
    public decimal? SecurityDeposit { get; set; }
    public decimal Price { get; set; }
    public int Floor { get; set; }
    public int TotalFloors { get; set; }
    public double Area { get; set; }
    public int NumberOfBedrooms { get; set; }
    public int NumberOfBathrooms { get; set; }
    
    // Alias properties for compatibility
    public int Rooms { get => NumberOfBedrooms; set => NumberOfBedrooms = value; }
    public int Bathrooms { get => NumberOfBathrooms; set => NumberOfBathrooms = value; }
    public int ViewCount { get => ViewsCount; set => ViewsCount = value; }
    public int FavoriteCount { get => FavoritesCount; set => FavoritesCount = value; }
    public Guid OwnerId { get => HostId; set => HostId = value; }
    public bool IsActive { get => IsVacant; set => IsVacant = value; }
    public PropertyType PropertyType { get => Type; set => Type = value; }
    public int MaxGuests { get; set; }
    public UzbekistanRegion Region { get; set; }
    public string City { get; set; }
    public string District { get; set; }
    public string Address { get; set; }
    public string Mahalla { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool HasWifi { get; set; }
    public bool HasParking { get; set; }
    public bool HasPool { get; set; }
    public bool PetsAllowed { get; set; }
    public bool IsInstantBook { get; set; }
    public bool IsVacant { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsVerified { get; set; }

    // Infrastructure (Uzbekistan-specific)
    public bool HasMetroNearby { get; set; }
    public bool HasBusStop { get; set; }
    public bool HasMarketNearby { get; set; }
    public bool HasSchoolNearby { get; set; }
    public bool HasHospitalNearby { get; set; }
    public double DistanceToCityCenter { get; set; }

    // Comfort
    public bool HasElevator { get; set; }
    public bool HasSecurity { get; set; }
    public bool HasGenerator { get; set; }
    public bool HasGas { get; set; }
    public bool HasFurniture { get; set; }
    public bool IsRenovated { get; set; }

    // International standard (Airbnb/Booking)
    public bool HasAirConditioning { get; set; }
    public bool HasHeating { get; set; }
    public bool HasWasher { get; set; }
    public bool HasKitchen { get; set; }
    public bool HasTV { get; set; }
    public bool HasWorkspace { get; set; }
    public bool IsSelfCheckIn { get; set; }
    public bool IsChildFriendly { get; set; }
    public bool IsAccessible { get; set; }
    public decimal AverageRating { get; set; }
    public int ViewsCount { get; set; }
    public int FavoritesCount { get; set; }
    public Guid HostId { get; set; }
    public ICollection<PropertyImage> Images { get; set; }
    public Currency Currency { get; set; } = Currency.UZS;
    public decimal ExchangeRate { get; set; } = 1.0m;
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
