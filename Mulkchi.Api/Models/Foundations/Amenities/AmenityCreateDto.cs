namespace Mulkchi.Api.Models.Foundations.Amenities;

public class AmenityCreateDto
{
    public string Name { get; set; }
    public string NameUz { get; set; }
    public string NameRu { get; set; }
    public string Icon { get; set; }
    public AmenityCategory Category { get; set; }
    public int DisplayOrder { get; set; }
}
