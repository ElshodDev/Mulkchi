using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Amenities;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Services.Foundations.Amenities;

public partial class AmenityService : IAmenityService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;

    public AmenityService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
    }

    public async ValueTask<AmenityResponse> AddAmenityAsync(AmenityCreateDto dto)
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var amenity = new Amenity
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            NameUz = dto.NameUz,
            NameRu = dto.NameRu,
            Icon = dto.Icon,
            Category = dto.Category,
            IsActive = true,
            DisplayOrder = dto.DisplayOrder,
            CreatedDate = now
        };

        var added = await this.storageBroker.InsertAmenityAsync(amenity);
        return ToAmenityResponse(added);
    }

    public IEnumerable<AmenityResponse> RetrieveAllAmenities()
    {
        return this.storageBroker.SelectAllAmenities()
            .Where(a => a.IsActive)
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Name)
            .AsEnumerable()
            .Select(ToAmenityResponse);
    }

    public IEnumerable<AmenityCategoryDto> RetrieveAmenitiesByCategory()
    {
        var amenities = this.storageBroker.SelectAllAmenities()
            .Where(a => a.IsActive)
            .OrderBy(a => a.DisplayOrder)
            .AsEnumerable();

        return amenities
            .GroupBy(a => a.Category)
            .Select(g => new AmenityCategoryDto
            {
                Category = g.Key,
                Name = g.Key.ToString(),
                NameUz = GetCategoryNameUz(g.Key),
                NameRu = GetCategoryNameRu(g.Key),
                Amenities = g.Select(ToAmenityResponse).ToList()
            })
            .OrderBy(c => c.Category);
    }

    public async ValueTask<Amenity?> RetrieveAmenityByIdAsync(Guid id)
    {
        return await this.storageBroker.SelectAmenityByIdAsync(id);
    }

    public async ValueTask<AmenityResponse> ModifyAmenityAsync(Guid id, AmenityCreateDto dto)
    {
        var amenity = await this.storageBroker.SelectAmenityByIdAsync(id);
        if (amenity is null)
            throw new ArgumentException($"Amenity with id '{id}' not found.");

        amenity.Name = dto.Name;
        amenity.NameUz = dto.NameUz;
        amenity.NameRu = dto.NameRu;
        amenity.Icon = dto.Icon;
        amenity.Category = dto.Category;
        amenity.DisplayOrder = dto.DisplayOrder;
        amenity.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

        var updated = await this.storageBroker.UpdateAmenityAsync(amenity);
        return ToAmenityResponse(updated);
    }

    public async ValueTask<bool> RemoveAmenityAsync(Guid id)
    {
        var amenity = await this.storageBroker.SelectAmenityByIdAsync(id);
        if (amenity is null)
            return false;

        amenity.IsActive = false;
        amenity.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        await this.storageBroker.UpdateAmenityAsync(amenity);
        return true;
    }

    public async ValueTask<IEnumerable<AmenityResponse>> RetrievePropertyAmenitiesAsync(Guid propertyId)
    {
        var propertyAmenities = await this.storageBroker.SelectAllPropertyAmenities()
            .Include(pa => pa.Amenity)
            .Where(pa => pa.PropertyId == propertyId)
            .Select(pa => pa.Amenity)
            .Where(a => a != null && a.IsActive)
            .ToListAsync();

        return propertyAmenities.Select(ToAmenityResponse);
    }

    public async ValueTask UpdatePropertyAmenitiesAsync(Guid propertyId, List<Guid> amenityIds)
    {
        // Remove existing amenities
        var existing = await this.storageBroker.SelectAllPropertyAmenities()
            .Where(pa => pa.PropertyId == propertyId)
            .ToListAsync();

        foreach (var pa in existing)
        {
            await this.storageBroker.DeletePropertyAmenityAsync(pa);
        }

        // Add new amenities
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        foreach (var amenityId in amenityIds.Distinct())
        {
            var amenity = await this.storageBroker.SelectAmenityByIdAsync(amenityId);
            if (amenity is null) continue;

            var propertyAmenity = new PropertyAmenity
            {
                PropertyId = propertyId,
                AmenityId = amenityId,
                CreatedDate = now
            };

            await this.storageBroker.InsertPropertyAmenityAsync(propertyAmenity);
        }
    }

    public async ValueTask<bool> PropertyHasAmenityAsync(Guid propertyId, Guid amenityId)
    {
        return await this.storageBroker.SelectAllPropertyAmenities()
            .AnyAsync(pa => pa.PropertyId == propertyId && pa.AmenityId == amenityId);
    }

    private static AmenityResponse ToAmenityResponse(Amenity a)
    {
        return new AmenityResponse
        {
            Id = a.Id,
            Name = a.Name,
            NameUz = a.NameUz,
            NameRu = a.NameRu,
            Icon = a.Icon,
            Category = a.Category,
            CategoryName = a.Category.ToString(),
            IsActive = a.IsActive,
            DisplayOrder = a.DisplayOrder,
            CreatedDate = a.CreatedDate
        };
    }

    private static string GetCategoryNameUz(AmenityCategory category)
    {
        return category switch
        {
            AmenityCategory.Basic => "Asosiy",
            AmenityCategory.Comfort => "Qulaylik",
            AmenityCategory.Kitchen => "Oshxona",
            AmenityCategory.Bedroom => "Yotoqxona",
            AmenityCategory.Building => "Bino",
            AmenityCategory.Outdoor => "Hovli",
            AmenityCategory.Policy => "Qoidalar",
            _ => category.ToString()
        };
    }

    private static string GetCategoryNameRu(AmenityCategory category)
    {
        return category switch
        {
            AmenityCategory.Basic => "Базовые",
            AmenityCategory.Comfort => "Комфорт",
            AmenityCategory.Kitchen => "Кухня",
            AmenityCategory.Bedroom => "Спальня",
            AmenityCategory.Building => "Здание",
            AmenityCategory.Outdoor => "Двор",
            AmenityCategory.Policy => "Правила",
            _ => category.ToString()
        };
    }
}
