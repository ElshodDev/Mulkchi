namespace Mulkchi.Api.Models.Foundations.Amenities;

public class Amenity
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string NameUz { get; set; }
    public string NameRu { get; set; }
    public string Icon { get; set; }
    public AmenityCategory Category { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? UpdatedDate { get; set; }
}

public enum AmenityCategory
{
    Basic = 1,      
    Comfort = 2,    
    Kitchen = 3,    
    Bedroom = 4,    
    Building = 5,   
    Outdoor = 6,    
    Policy = 7      
}
