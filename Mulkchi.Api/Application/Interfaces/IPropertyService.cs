using Mulkchi.Api.Application.DTOs;
using Mulkchi.Api.Application.DTOs.Common;

namespace Mulkchi.Api.Application.Interfaces;

/// <summary>
/// Property service interface
/// BMI: Clean Architecture - Application Layer Service
/// </summary>
public interface IPropertyService
{
    Task<PropertyDto?> GetByIdAsync(Guid id);
    Task<PaginatedResult<PropertyDto>> GetAllAsync(PaginationRequest request);
    Task<PaginatedResult<PropertyDto>> SearchAsync(PropertySearchRequest request);
    Task<PropertyDto> CreateAsync(CreatePropertyRequest request, Guid ownerId);
    Task<PropertyDto> UpdateAsync(UpdatePropertyRequest request);
    Task DeleteAsync(Guid id);
    Task<bool> IsOwnerAsync(Guid propertyId, Guid userId);
}

public class PropertySearchRequest : PaginationRequest
{
    public string? Keyword { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinRooms { get; set; }
    public int? MaxRooms { get; set; }
    public double? MinArea { get; set; }
    public double? MaxArea { get; set; }
    public string? PropertyType { get; set; }
    public string? SortBy { get; set; } = "CreatedDate";
    public string? SortOrder { get; set; } = "desc";
}
