namespace Mulkchi.Api.Models.Foundations.Amenities;

public class Amenity
{
    public Guid Id { get; set; }
    public string Name { get; set; } // "WiFi", "Parking" etc
    public string NameUz { get; set; } // O'zbek tili
    public string NameRu { get; set; } // Rus tili
    public string Icon { get; set; } // icon name e.g. "wifi", "car"
    public AmenityCategory Category { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? UpdatedDate { get; set; }
}

public enum AmenityCategory
{
    Basic = 1,       // WiFi, Electricity, Water
    Comfort = 2,     // AC, Heating, Washing Machine
    Kitchen = 3,     // Refrigerator, Dishwasher, Microwave
    Bedroom = 4,     // Wardrobe, TV
    Building = 5,    // Elevator, Parking, Security
    Outdoor = 6,     // Balcony, Garden, Pool
    Policy = 7       // PetFriendly, SmokingAllowed
}
