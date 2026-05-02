using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Application.DTOs;
using Mulkchi.Api.Application.DTOs.Common;
using Mulkchi.Api.Application.Interfaces;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Application.Services;

/// <summary>
/// Property service implementation
/// BMI: Clean Architecture - Application Layer Service Implementation
/// </summary>
public class PropertyService : IPropertyService
{
    private readonly IRepository<Property> _propertyRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStorageBroker _storageBroker;

    public PropertyService(
        IRepository<Property> propertyRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork,
        IStorageBroker storageBroker)
    {
        _propertyRepository = propertyRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _storageBroker = storageBroker;
    }

    public async Task<PropertyDto?> GetByIdAsync(Guid id)
    {
        var property = await _storageBroker.SelectPropertyByIdAsync(id);
        if (property == null) return null;

        return MapToDto(property);
    }

    public async Task<PaginatedResult<PropertyDto>> GetAllAsync(PaginationRequest request)
    {
        var query = (await _propertyRepository.GetAllAsync())
            .Where(p => p.DeletedDate == null)
            .AsQueryable();

        var totalCount = query.Count();
        var items = query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        return new PaginatedResult<PropertyDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<PaginatedResult<PropertyDto>> SearchAsync(PropertySearchRequest request)
    {
        var query = _storageBroker.SelectAllProperties()
            .Where(p => p.DeletedDate == null)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.Keyword))
        {
            var keyword = request.Keyword.ToLower();
            query = query.Where(p => 
                p.Title.ToLower().Contains(keyword) ||
                p.Description.ToLower().Contains(keyword) ||
                p.Address.ToLower().Contains(keyword));
        }

        if (!string.IsNullOrEmpty(request.City))
            query = query.Where(p => p.City == request.City);

        if (!string.IsNullOrEmpty(request.Region))
        {
            if (Enum.TryParse<UzbekistanRegion>(request.Region, out var regionValue))
                query = query.Where(p => p.Region == regionValue);
        }

        if (request.MinPrice.HasValue)
            query = query.Where(p => p.Price >= request.MinPrice.Value);

        if (request.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= request.MaxPrice.Value);

        if (request.MinRooms.HasValue)
            query = query.Where(p => p.Rooms >= request.MinRooms.Value);

        if (request.MaxRooms.HasValue)
            query = query.Where(p => p.Rooms <= request.MaxRooms.Value);

        if (request.MinArea.HasValue)
            query = query.Where(p => p.Area >= request.MinArea.Value);

        if (request.MaxArea.HasValue)
            query = query.Where(p => p.Area <= request.MaxArea.Value);

        if (!string.IsNullOrEmpty(request.PropertyType) && 
            Enum.TryParse<PropertyType>(request.PropertyType, out var propertyType))
        {
            query = query.Where(p => p.PropertyType == propertyType);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "price" => request.SortOrder?.ToLower() == "asc" 
                ? query.OrderBy(p => p.Price) 
                : query.OrderByDescending(p => p.Price),
            "area" => request.SortOrder?.ToLower() == "asc" 
                ? query.OrderBy(p => p.Area) 
                : query.OrderByDescending(p => p.Area),
            "rooms" => request.SortOrder?.ToLower() == "asc" 
                ? query.OrderBy(p => p.Rooms) 
                : query.OrderByDescending(p => p.Rooms),
            _ => query.OrderByDescending(p => p.CreatedDate)
        };

        var totalCount = query.Count();
        var items = query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        return new PaginatedResult<PropertyDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<PropertyDto> CreateAsync(CreatePropertyRequest request, Guid ownerId)
    {
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            PropertyType = request.PropertyType,
            Status = PropertyStatus.Available,
            Price = request.Price,
            Rooms = request.Rooms,
            Bathrooms = request.Bathrooms,
            Area = request.Area,
            Floor = request.Floor,
            TotalFloors = request.TotalFloors,
            Address = request.Address,
            City = request.City,
            Region = Enum.Parse<UzbekistanRegion>(request.Region),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            OwnerId = ownerId,
            CreatedDate = DateTimeOffset.UtcNow,
            UpdatedDate = DateTimeOffset.UtcNow,
            ViewCount = 0,
            FavoriteCount = 0,
            IsVerified = false,
            IsActive = true
        };

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            await _propertyRepository.AddAsync(property);
            await _unitOfWork.CommitTransactionAsync();
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }

        return MapToDto(property);
    }

    public async Task<PropertyDto> UpdateAsync(UpdatePropertyRequest request)
    {
        var property = await _propertyRepository.GetByIdAsync(request.Id);
        if (property == null)
            throw new KeyNotFoundException($"Property with ID {request.Id} not found");

        property.Title = request.Title;
        property.Description = request.Description;
        property.Status = request.Status;
        property.Price = request.Price;
        property.Rooms = request.Rooms;
        property.Bathrooms = request.Bathrooms;
        property.Area = request.Area;
        property.UpdatedDate = DateTimeOffset.UtcNow;

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            await _propertyRepository.UpdateAsync(property);
            await _unitOfWork.CommitTransactionAsync();
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }

        return MapToDto(property);
    }

    public async Task DeleteAsync(Guid id)
    {
        var property = await _propertyRepository.GetByIdAsync(id);
        if (property == null)
            throw new KeyNotFoundException($"Property with ID {id} not found");

        property.DeletedDate = DateTimeOffset.UtcNow;
        property.IsActive = false;

        await _propertyRepository.UpdateAsync(property);
    }

    public async Task<bool> IsOwnerAsync(Guid propertyId, Guid userId)
    {
        var property = await _propertyRepository.GetByIdAsync(propertyId);
        return property?.OwnerId == userId;
    }

    private static PropertyDto MapToDto(Property property)
    {
        return new PropertyDto
        {
            Id = property.Id,
            Title = property.Title,
            Description = property.Description,
            PropertyType = property.PropertyType,
            Status = property.Status,
            Price = property.Price,
            PricePerSquareMeter = property.Area > 0 ? property.Price / (decimal)property.Area : null,
            Rooms = property.Rooms,
            Bathrooms = property.Bathrooms,
            Area = property.Area,
            Floor = property.Floor,
            TotalFloors = property.TotalFloors,
            Address = property.Address,
            City = property.City,
            Region = property.Region.ToString(),
            Country = "Uzbekistan",
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            OwnerId = property.OwnerId,
            CreatedDate = property.CreatedDate,
            UpdatedDate = property.UpdatedDate,
            ViewCount = property.ViewCount,
            FavoriteCount = property.FavoriteCount,
            Images = property.Images?.Select(img => new PropertyImageDto
            {
                Id = img.Id,
                Url = img.Url,
                MediumUrl = img.MediumUrl,
                ThumbnailUrl = img.ThumbnailUrl,
                Caption = img.Caption,
                IsPrimary = img.IsPrimary,
                SortOrder = img.SortOrder
            }).ToList() ?? new List<PropertyImageDto>()
        };
    }
}
