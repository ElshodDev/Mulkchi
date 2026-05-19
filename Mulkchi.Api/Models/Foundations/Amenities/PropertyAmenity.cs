using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Models.Foundations.Amenities;

public class PropertyAmenity
{
    public Guid PropertyId { get; set; }
    public Guid AmenityId { get; set; }
    public DateTimeOffset CreatedDate { get; set; }

    public virtual Property Property { get; set; }
    public virtual Amenity Amenity { get; set; }
}
