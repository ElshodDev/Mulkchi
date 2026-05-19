namespace Mulkchi.Api.Models.Foundations.Geo;

public class PropertyMapDto
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string City { get; set; }
    public string? District { get; set; }
    public decimal? Price { get; set; }
    public string ListingType { get; set; }
    public int NumberOfBedrooms { get; set; }
    public double Area { get; set; }
}
