using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Application.DTOs;

/// <summary>
/// Property Data Transfer Object
/// BMI: Clean Architecture - Application Layer DTO
/// </summary>
public class PropertyDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PropertyType PropertyType { get; set; }
    public PropertyStatus Status { get; set; }
    public decimal Price { get; set; }
    public decimal? PricePerSquareMeter { get; set; }
    public int Rooms { get; set; }
    public int Bathrooms { get; set; }
    public double Area { get; set; }
    public int Floor { get; set; }
    public int TotalFloors { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Country { get; set; } = "Uzbekistan";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public List<string> Amenities { get; set; } = new();
    public List<PropertyImageDto> Images { get; set; } = new();
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public int ViewCount { get; set; }
    public int FavoriteCount { get; set; }
}

public class PropertyImageDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string MediumUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
}

public class CreatePropertyRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PropertyType PropertyType { get; set; }
    public decimal Price { get; set; }
    public int Rooms { get; set; }
    public int Bathrooms { get; set; }
    public double Area { get; set; }
    public int Floor { get; set; }
    public int TotalFloors { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public List<string> Amenities { get; set; } = new();
}

public class UpdatePropertyRequest
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PropertyStatus Status { get; set; }
    public decimal Price { get; set; }
    public int Rooms { get; set; }
    public int Bathrooms { get; set; }
    public double Area { get; set; }
    public List<string> Amenities { get; set; } = new();
}
