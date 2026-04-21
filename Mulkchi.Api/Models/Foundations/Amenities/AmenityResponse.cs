namespace Mulkchi.Api.Models.Foundations.Amenities;

public class AmenityResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string NameUz { get; set; }
    public string NameRu { get; set; }
    public string Icon { get; set; }
    public AmenityCategory Category { get; set; }
    public string CategoryName { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}
