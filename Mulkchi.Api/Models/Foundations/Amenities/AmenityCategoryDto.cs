namespace Mulkchi.Api.Models.Foundations.Amenities;

public class AmenityCategoryDto
{
    public AmenityCategory Category { get; set; }
    public string Name { get; set; }
    public string NameUz { get; set; }
    public string NameRu { get; set; }
    public List<AmenityResponse> Amenities { get; set; }
}
