using Mulkchi.Api.Models.Foundations.Common;

namespace Mulkchi.Api.Models.Foundations.Properties
{
    public class PropertyCreateDto
    {
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
        public double Area { get; set; }
        public int NumberOfBedrooms { get; set; }
        public int NumberOfBathrooms { get; set; }
        public int MaxGuests { get; set; }
        public UzbekistanRegion Region { get; set; }
        public string City { get; set; }
        public string District { get; set; }
        public string Address { get; set; }
        public string Mahalla { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        
        // Amenities
        public bool HasWifi { get; set; }
        public bool HasParking { get; set; }
        public bool HasPool { get; set; }
        public bool PetsAllowed { get; set; }
        public bool IsInstantBook { get; set; }
        public bool IsVacant { get; set; }
        
        // Location Perks
        public bool HasMetroNearby { get; set; }
        public bool HasBusStop { get; set; }
        public bool HasMarketNearby { get; set; }
        public bool HasSchoolNearby { get; set; }
        public bool HasHospitalNearby { get; set; }
        public double? DistanceToCityCenter { get; set; }
        
        // Property Features
        public bool HasElevator { get; set; }
        public bool HasSecurity { get; set; }
        public bool HasGenerator { get; set; }
        public bool HasGas { get; set; }
        public bool HasFurniture { get; set; }
        public bool IsRenovated { get; set; }
        public bool HasAirConditioning { get; set; }
        public bool HasHeating { get; set; }
        public bool HasWasher { get; set; }
        public bool HasKitchen { get; set; }
        public bool HasTV { get; set; }
        public bool HasWorkspace { get; set; }
        public bool IsSelfCheckIn { get; set; }
        public bool IsChildFriendly { get; set; }
        public bool IsAccessible { get; set; }

        public Currency Currency { get; set; }
        public decimal ExchangeRate { get; set; }
    }
}