using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Properties.Exceptions;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Users;
using Microsoft.Extensions.Localization;
using Mulkchi.Api.Models.Foundations.Properties.Extensions;
using Mulkchi.Api.Resources;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.FeatureManagement;
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Mulkchi.Api.Services.Search;

namespace Mulkchi.Api.Services.Foundations.Properties;

public partial class PropertyService : IPropertyService
{
    private const string PropertyCacheVersionKey = "properties:list:version";
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ICurrentUserService currentUserService;
    private readonly IUserService userService;
    private readonly IAuthService authService;
    private readonly IStringLocalizer<SharedResource> localizer;
    private readonly IDistributedCache distributedCache;
    private readonly IFeatureManager featureManager;
    private readonly IMeiliPropertySearchService meiliPropertySearchService;

    public PropertyService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ICurrentUserService currentUserService,
        IUserService userService,
        IAuthService authService,
        IStringLocalizer<SharedResource> localizer,
        IDistributedCache distributedCache,
        IFeatureManager featureManager,
        IMeiliPropertySearchService meiliPropertySearchService)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.currentUserService = currentUserService;
        this.userService = userService;
        this.authService = authService;
        this.localizer = localizer;
        this.distributedCache = distributedCache;
        this.featureManager = featureManager;
        this.meiliPropertySearchService = meiliPropertySearchService;
    }

    public async ValueTask<PropertyResponse> AddPropertyAsync(PropertyCreateDto dto)
    {
        var currentUserId = this.currentUserService.GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            throw new UnauthorizedAccessException("Current user is missing.");
        }

        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();

        var property = new Property
        {
            Id = Guid.NewGuid(),
            HostId = currentUserId.Value,
            Title = dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            Category = dto.Category,
            Status = dto.Status,
            ListingType = dto.ListingType,
            MonthlyRent = dto.MonthlyRent,
            SalePrice = dto.SalePrice,
            PricePerNight = dto.PricePerNight,
            SecurityDeposit = dto.SecurityDeposit,
            Area = dto.Area,
            NumberOfBedrooms = dto.NumberOfBedrooms,
            NumberOfBathrooms = dto.NumberOfBathrooms,
            MaxGuests = dto.MaxGuests,
            Region = dto.Region,
            City = dto.City,
            District = dto.District,
            Address = dto.Address,
            Mahalla = dto.Mahalla,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            HasWifi = dto.HasWifi,
            HasParking = dto.HasParking,
            HasPool = dto.HasPool,
            PetsAllowed = dto.PetsAllowed,
            IsInstantBook = dto.IsInstantBook,
            IsVacant = dto.IsVacant,
            HasMetroNearby = dto.HasMetroNearby,
            HasBusStop = dto.HasBusStop,
            HasMarketNearby = dto.HasMarketNearby,
            HasSchoolNearby = dto.HasSchoolNearby,
            HasHospitalNearby = dto.HasHospitalNearby,
            DistanceToCityCenter = dto.DistanceToCityCenter ?? 0,
            HasElevator = dto.HasElevator,
            HasSecurity = dto.HasSecurity,
            HasGenerator = dto.HasGenerator,
            HasGas = dto.HasGas,
            HasFurniture = dto.HasFurniture,
            IsRenovated = dto.IsRenovated,
            HasAirConditioning = dto.HasAirConditioning,
            HasHeating = dto.HasHeating,
            HasWasher = dto.HasWasher,
            HasKitchen = dto.HasKitchen,
            HasTV = dto.HasTV,
            HasWorkspace = dto.HasWorkspace,
            IsSelfCheckIn = dto.IsSelfCheckIn,
            IsChildFriendly = dto.IsChildFriendly,
            IsAccessible = dto.IsAccessible,
            Currency = dto.Currency,
            ExchangeRate = dto.ExchangeRate,
            
            // Set defaults enforced by business rules
            IsFeatured = false,
            IsVerified = false,
            AverageRating = 0,
            ViewsCount = 0,
            FavoritesCount = 0,
            CreatedDate = now,
            UpdatedDate = now
        };

        ValidatePropertyOnAdd(property);
        Property addedProperty = await this.storageBroker.InsertPropertyAsync(property);
        await InvalidatePropertyListCacheAsync();

        return ToPropertyResponse(addedProperty);
    }

    public ValueTask<Property> AddPropertyAsync(Property property) =>
        TryCatch(async () =>
        {
            ValidatePropertyOnAdd(property);
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            property.CreatedDate = now;
            property.UpdatedDate = now;
            return await this.storageBroker.InsertPropertyAsync(property);
        });

    public async ValueTask<(IEnumerable<PropertyResponse> Items, int TotalCount)> RetrieveAllPropertiesAsync(PropertyQueryParams queryParams)
    {
        long cacheVersion = await GetPropertyCacheVersionAsync();
        string cacheKey = BuildPropertyListCacheKey(queryParams, cacheVersion);
        string cachedJson = await this.distributedCache.GetStringAsync(cacheKey);
        if (!string.IsNullOrWhiteSpace(cachedJson))
        {
            var cached = JsonSerializer.Deserialize<CachedPropertyListResult>(cachedJson);
            if (cached is not null)
            {
                return (cached.Items, cached.TotalCount);
            }
        }

        IQueryable<Property> query = this.storageBroker.SelectAllProperties();

        if (!string.IsNullOrWhiteSpace(queryParams.City))
            query = query.Where(p => p.City == queryParams.City);

        if (queryParams.MinPrice.HasValue)
            query = query.Where(p => p.MonthlyRent >= queryParams.MinPrice || p.SalePrice >= queryParams.MinPrice || p.PricePerNight >= queryParams.MinPrice);

        if (queryParams.MaxPrice.HasValue)
            query = query.Where(p => p.MonthlyRent <= queryParams.MaxPrice || p.SalePrice <= queryParams.MaxPrice || p.PricePerNight <= queryParams.MaxPrice);

        if (queryParams.Bedrooms.HasValue)
            query = query.Where(p => p.NumberOfBedrooms == queryParams.Bedrooms);

        if (queryParams.Region.HasValue)
            query = query.Where(p => p.Region == queryParams.Region.Value);

        if (queryParams.ListingType.HasValue)
            query = query.Where(p => p.ListingType == queryParams.ListingType.Value);
            
        if (queryParams.PropertyType.HasValue)
            query = query.Where(p => p.Type == queryParams.PropertyType.Value);

        if (!string.IsNullOrWhiteSpace(queryParams.SearchQuery))
        {
            var q = queryParams.SearchQuery.ToLower();
            query = query.Where(p =>
                (p.Title != null && p.Title.ToLower().Contains(q)) ||
                (p.Description != null && p.Description.ToLower().Contains(q)) ||
                (p.City != null && p.City.ToLower().Contains(q)));
        }
        if (queryParams.HasWifi.HasValue && queryParams.HasWifi.Value)
            query = query.Where(p => p.HasWifi);
        if (queryParams.HasParking.HasValue && queryParams.HasParking.Value)
            query = query.Where(p => p.HasParking);
        if (queryParams.HasPool.HasValue && queryParams.HasPool.Value)
            query = query.Where(p => p.HasPool);
        if (queryParams.PetsAllowed.HasValue && queryParams.PetsAllowed.Value)
            query = query.Where(p => p.PetsAllowed);
        if (queryParams.IsInstantBook.HasValue && queryParams.IsInstantBook.Value)
            query = query.Where(p => p.IsInstantBook);
        if (queryParams.MinArea.HasValue)
            query = query.Where(p => p.Area >= queryParams.MinArea.Value);
        if (queryParams.MaxArea.HasValue)
            query = query.Where(p => p.Area <= queryParams.MaxArea.Value);
        if (queryParams.MaxGuests.HasValue)
            query = query.Where(p => p.MaxGuests >= queryParams.MaxGuests.Value);

        int totalCount = await query.CountAsync();

        query = queryParams.SortBy switch {
            "price_asc"  => query.OrderBy(p => p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight),
            "price_desc" => query.OrderByDescending(p => p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight),
            "rating"     => query.OrderByDescending(p => p.AverageRating),
            "newest"     => query.OrderByDescending(p => p.CreatedDate),
            _            => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.AverageRating)
        };

        var properties = await query
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync();

        var responseItems = properties.Select(ToPropertyResponse).ToList();

        await this.distributedCache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(new CachedPropertyListResult
            {
                TotalCount = totalCount,
                Items = responseItems
            }),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            });

        return (responseItems, totalCount);
    }

    private static string BuildPropertyListCacheKey(PropertyQueryParams queryParams, long version) =>
        $"properties:list:v{version}:{queryParams.Page}:{queryParams.PageSize}:{queryParams.SortBy}:{queryParams.City}:{queryParams.Region}:{queryParams.ListingType}:{queryParams.PropertyType}:{queryParams.MinPrice}:{queryParams.MaxPrice}:{queryParams.Bedrooms}:{queryParams.SearchQuery}";

    private async ValueTask<long> GetPropertyCacheVersionAsync()
    {
        string cachedVersion = await this.distributedCache.GetStringAsync(PropertyCacheVersionKey);
        if (long.TryParse(cachedVersion, out long version) && version > 0)
        {
            return version;
        }

        await this.distributedCache.SetStringAsync(
            PropertyCacheVersionKey,
            "1",
            new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromDays(1)
            });

        return 1;
    }

    private async ValueTask InvalidatePropertyListCacheAsync()
    {
        long currentVersion = await GetPropertyCacheVersionAsync();
        await this.distributedCache.SetStringAsync(
            PropertyCacheVersionKey,
            (currentVersion + 1).ToString(),
            new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromDays(1)
            });
    }

    private sealed class CachedPropertyListResult
    {
        public int TotalCount { get; init; }
        public List<PropertyResponse> Items { get; init; } = new();
    }

    public async ValueTask<(IEnumerable<PropertyResponse> Items, int TotalCount)> SearchPropertiesAsync(PropertySearchParams searchParams)
    {
        if (!string.IsNullOrWhiteSpace(searchParams.SearchQuery) &&
            await this.featureManager.IsEnabledAsync("UseMeiliSearch"))
        {
            var (ids, meiliTotalCount) = await this.meiliPropertySearchService.SearchAsync(searchParams.SearchQuery, 50);
            if (ids.Count > 0)
            {
                var orderedById = ids.Select((id, index) => new { id, index })
                    .ToDictionary(x => x.id, x => x.index);

                var meiliProperties = await this.storageBroker.SelectAllProperties()
                    .Where(p => ids.Contains(p.Id))
                    .ToListAsync();

                var ordered = meiliProperties
                    .OrderBy(p => orderedById.TryGetValue(p.Id, out int idx) ? idx : int.MaxValue)
                    .Take(50)
                    .Select(ToPropertyResponse)
                    .ToList();

                return (ordered, meiliTotalCount);
            }
        }

        IQueryable<Property> query = this.storageBroker.SelectAllProperties()
            .Where(p => p.DeletedDate == null);

        if (!string.IsNullOrWhiteSpace(searchParams.City))
            query = query.Where(p => p.City == searchParams.City);

        if (searchParams.MinPrice.HasValue)
            query = query.Where(p => p.MonthlyRent >= searchParams.MinPrice || p.SalePrice >= searchParams.MinPrice || p.PricePerNight >= searchParams.MinPrice);

        if (searchParams.MaxPrice.HasValue)
            query = query.Where(p => p.MonthlyRent <= searchParams.MaxPrice || p.SalePrice <= searchParams.MaxPrice || p.PricePerNight <= searchParams.MaxPrice);

        if (searchParams.Bedrooms.HasValue)
            query = query.Where(p => p.NumberOfBedrooms == searchParams.Bedrooms);

        if (searchParams.ListingType.HasValue)
            query = query.Where(p => p.ListingType == searchParams.ListingType.Value);

        if (searchParams.PropertyType.HasValue)
            query = query.Where(p => p.Type == searchParams.PropertyType.Value);

        if (searchParams.HasWifi.HasValue && searchParams.HasWifi.Value)
            query = query.Where(p => p.HasWifi);
        if (searchParams.HasParking.HasValue && searchParams.HasParking.Value)
            query = query.Where(p => p.HasParking);
        if (searchParams.HasPool.HasValue && searchParams.HasPool.Value)
            query = query.Where(p => p.HasPool);

        if (searchParams.Latitude.HasValue && searchParams.Longitude.HasValue)
        {
            var radius = searchParams.RadiusKm ?? 10.0;
            query = query.WithinRadius(searchParams.Latitude.Value, searchParams.Longitude.Value, radius);
        }

        int totalCount = await query.CountAsync();

        if (searchParams.Latitude.HasValue && searchParams.Longitude.HasValue && string.IsNullOrEmpty(searchParams.SortBy))
        {
            query = query.OrderByDistance(searchParams.Latitude.Value, searchParams.Longitude.Value);
        }
        else
        {
            query = searchParams.SortBy switch {
                "price_asc"  => query.OrderBy(p => p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight),
                "price_desc" => query.OrderByDescending(p => p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight),
                "rating"     => query.OrderByDescending(p => p.AverageRating),
                "newest"     => query.OrderByDescending(p => p.CreatedDate),
                _            => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.AverageRating)
            };
        }

        // Apply a default limit to the search size since there is no pagination params in PropertySearchParams
        var properties = await query.Take(50).ToListAsync();
        var responseItems = properties.Select(ToPropertyResponse).ToList();

        return (responseItems, totalCount);
    }
    
    // Kept for backward compatibility handling
    public IQueryable<Property> RetrieveAllProperties() =>
        TryCatch(() => this.storageBroker.SelectAllProperties());

    public ValueTask<Property> RetrievePropertyByIdAsync(Guid propertyId) =>
        TryCatch(async () =>
        {
            ValidatePropertyId(propertyId);
            Property maybeProperty = await this.storageBroker.SelectPropertyByIdAsync(propertyId);

            if (maybeProperty is null)
                throw new NotFoundPropertyException(propertyId);

            return maybeProperty;
        });

    public ValueTask<Property> ModifyPropertyAsync(Property property) =>
        TryCatch(async () =>
        {
            ValidatePropertyOnModify(property);
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && property.HostId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only modify your own properties.");
            }
            property.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            Property updatedProperty = await this.storageBroker.UpdatePropertyAsync(property);
            await InvalidatePropertyListCacheAsync();
            return updatedProperty;
        });

    public ValueTask<Property> RemovePropertyByIdAsync(Guid propertyId) =>
        TryCatch(async () =>
        {
            ValidatePropertyId(propertyId);
            Property existingProperty = await this.storageBroker.SelectPropertyByIdAsync(propertyId);
            if (existingProperty is null)
                throw new NotFoundPropertyException(propertyId);
            
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && existingProperty.HostId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("You can only delete your own properties.");
            }
            Property deletedProperty = await this.storageBroker.DeletePropertyByIdAsync(propertyId);
            await InvalidatePropertyListCacheAsync();
            return deletedProperty;
        });

    public async ValueTask<PropertyResponse> PublishPropertyAsync(Guid propertyId)
    {
        var property = await RetrievePropertyEntityByIdAsync(propertyId);
        if (property is null)
            throw new NotFoundPropertyException(propertyId);

        property.Status = PropertyStatus.Active;
        property.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        await ModifyPropertyAsync(property);

        return ToPropertyResponse(property);
    }

    public async ValueTask<PropertyResponse> UnpublishPropertyAsync(Guid propertyId)
    {
        var property = await RetrievePropertyEntityByIdAsync(propertyId);
        if (property is null)
            throw new NotFoundPropertyException(propertyId);

        property.Status = PropertyStatus.Inactive;
        property.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
        await ModifyPropertyAsync(property);

        return ToPropertyResponse(property);
    }

    public async ValueTask<PropertyCreateResponse> AddPropertyWithUserUpgradeAsync(PropertyCreateDto dto, ClaimsPrincipal user)
    {
        // Auto-upgrade user to Host role if they're creating their first property
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        AuthResponse? newTokens = null;
        
        if (userIdClaim is not null && Guid.TryParse(userIdClaim, out Guid userId))
        {
            User upgradedUser = await this.userService.UpgradeToHostAsync(userId);
            
            // If user was upgraded (was Guest), generate new tokens with Host role
            if (upgradedUser.Role == UserRole.Host && upgradedUser.CurrentMode == UserRole.Host)
            {
                newTokens = await this.authService.GenerateTokensForUserAsync(userId);
            }
        }
        
        var addedProperty = await AddPropertyAsync(dto);
        
        return new PropertyCreateResponse
        {
            Property = addedProperty,
            Tokens = newTokens
        };
    }

    private static PropertyResponse ToPropertyResponse(Property p)
    {
        return new PropertyResponse
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Type = p.Type,
            Category = p.Category,
            Status = p.Status,
            ListingType = p.ListingType,
            MonthlyRent = p.MonthlyRent,
            SalePrice = p.SalePrice,
            PricePerNight = p.PricePerNight,
            SecurityDeposit = p.SecurityDeposit,
            Area = p.Area,
            NumberOfBedrooms = p.NumberOfBedrooms,
            NumberOfBathrooms = p.NumberOfBathrooms,
            MaxGuests = p.MaxGuests,
            Region = p.Region,
            City = p.City,
            District = p.District,
            Address = p.Address,
            Mahalla = p.Mahalla,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            HasWifi = p.HasWifi,
            HasParking = p.HasParking,
            HasPool = p.HasPool,
            PetsAllowed = p.PetsAllowed,
            IsInstantBook = p.IsInstantBook,
            IsVacant = p.IsVacant,
            IsFeatured = p.IsFeatured,
            IsVerified = p.IsVerified,
            HasMetroNearby = p.HasMetroNearby,
            HasBusStop = p.HasBusStop,
            HasMarketNearby = p.HasMarketNearby,
            HasSchoolNearby = p.HasSchoolNearby,
            HasHospitalNearby = p.HasHospitalNearby,
            DistanceToCityCenter = p.DistanceToCityCenter,
            HasElevator = p.HasElevator,
            HasSecurity = p.HasSecurity,
            HasGenerator = p.HasGenerator,
            HasGas = p.HasGas,
            HasFurniture = p.HasFurniture,
            IsRenovated = p.IsRenovated,
            HasAirConditioning = p.HasAirConditioning,
            HasHeating = p.HasHeating,
            HasWasher = p.HasWasher,
            HasKitchen = p.HasKitchen,
            HasTV = p.HasTV,
            HasWorkspace = p.HasWorkspace,
            IsSelfCheckIn = p.IsSelfCheckIn,
            IsChildFriendly = p.IsChildFriendly,
            IsAccessible = p.IsAccessible,
            AverageRating = p.AverageRating,
            ViewsCount = p.ViewsCount,
            FavoritesCount = p.FavoritesCount,
            HostId = p.HostId,
            Currency = p.Currency,
            ExchangeRate = p.ExchangeRate,
            CreatedDate = p.CreatedDate,
            UpdatedDate = p.UpdatedDate,
            DeletedDate = p.DeletedDate,
            MonthlyRentUSD = (p.MonthlyRent.HasValue && p.ExchangeRate > 0) ? p.MonthlyRent.Value / p.ExchangeRate : null,
            SalePriceUSD = (p.SalePrice.HasValue && p.ExchangeRate > 0) ? p.SalePrice.Value / p.ExchangeRate : null,
            PricePerNightUSD = (p.PricePerNight.HasValue && p.ExchangeRate > 0) ? p.PricePerNight.Value / p.ExchangeRate : null,
            SecurityDepositUSD = (p.SecurityDeposit.HasValue && p.ExchangeRate > 0) ? p.SecurityDeposit.Value / p.ExchangeRate : null
        };
    }

    public async ValueTask<IEnumerable<string>> SearchLocationSuggestionsAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return Enumerable.Empty<string>();

        var q = query.ToLower();
        var locations = await this.storageBroker.SelectAllProperties()
            .Where(p => (p.City != null && p.City.ToLower().Contains(q)) || 
                        (p.District != null && p.District.ToLower().Contains(q)))
            .Select(p => p.City != null && p.City.ToLower().Contains(q) ? p.City : p.District)
            .Distinct()
            .Take(8)
            .ToListAsync();

        return locations.Where(l => l != null)!;
    }

    public async ValueTask<IEnumerable<PropertyResponse>> RetrieveSimilarPropertiesAsync(Guid propertyId, int count = 6)
    {
        var sourceProperty = await this.storageBroker.SelectPropertyByIdAsync(propertyId);
        if (sourceProperty is null) return Enumerable.Empty<PropertyResponse>();

        var similar = await this.storageBroker.SelectAllProperties()
            
            .Where(p => p.Id != propertyId && 
                        p.IsVacant &&
                        (p.Type == sourceProperty.Type || p.City == sourceProperty.City))
            .OrderByDescending(p => p.AverageRating)
            .Take(count)
            .ToListAsync();

        return similar.Select(ToPropertyResponse);
    }

    public async ValueTask<IEnumerable<PropertyResponse>> RetrieveFeaturedPropertiesAsync(int count = 8)
    {
        var featured = await this.storageBroker.SelectAllProperties()
            
            .Where(p => p.IsFeatured && p.IsVacant)
            .OrderByDescending(p => p.AverageRating)
            .Take(count)
            .ToListAsync();

        return featured.Select(ToPropertyResponse);
    }

    public async ValueTask<Property?> RetrievePropertyEntityByIdAsync(Guid propertyId)
    {
        return await this.storageBroker.SelectPropertyByIdAsync(propertyId);
    }

    public async ValueTask<(IEnumerable<PropertyResponse> Items, int TotalCount)> RetrieveMyPropertiesAsync(PropertyQueryParams queryParams)
    {
        var currentUserId = this.currentUserService.GetCurrentUserId();
        if (!currentUserId.HasValue)
            throw new UnauthorizedAccessException("User not authenticated.");

        var query = this.storageBroker.SelectAllProperties()
            .Where(p => p.HostId == currentUserId.Value);

        // Apply status filter if specified
        if (!string.IsNullOrEmpty(queryParams.Status))
        {
            if (Enum.TryParse<PropertyStatus>(queryParams.Status, out var status))
                query = query.Where(p => p.Status == status);
        }

        // Apply sorting
        query = queryParams.SortBy?.ToLower() switch
        {
            "price" => queryParams.SortDescending ? query.OrderByDescending(p => p.SalePrice ?? p.MonthlyRent ?? 0) : query.OrderBy(p => p.SalePrice ?? p.MonthlyRent ?? 0),
            "date" => queryParams.SortDescending ? query.OrderByDescending(p => p.CreatedDate) : query.OrderBy(p => p.CreatedDate),
            "views" => queryParams.SortDescending ? query.OrderByDescending(p => p.ViewsCount) : query.OrderBy(p => p.ViewsCount),
            _ => query.OrderByDescending(p => p.CreatedDate)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync();

        return (items.Select(ToPropertyResponse), total);
    }

    public async ValueTask<IEnumerable<PropertyResponse>> RetrieveNewListingsAsync(int days, int count)
    {
        var cutoffDate = this.dateTimeBroker.GetCurrentDateTimeOffset().AddDays(-days);

        var properties = await this.storageBroker.SelectAllProperties()
            .Where(p => p.Status == PropertyStatus.Active && p.CreatedDate >= cutoffDate)
            .OrderByDescending(p => p.CreatedDate)
            .Take(count)
            .ToListAsync();

        return properties.Select(ToPropertyResponse);
    }
}
