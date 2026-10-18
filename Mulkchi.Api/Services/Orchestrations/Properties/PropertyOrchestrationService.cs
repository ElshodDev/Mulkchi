using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Tokens;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Services.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Favorites;
using Mulkchi.Api.Services.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.SavedSearches;
using Mulkchi.Api.Services.Foundations.Users;

namespace Mulkchi.Api.Services.Orchestrations.Properties;

public class PropertyOrchestrationService : IPropertyOrchestrationService
{
    private readonly IPropertyService propertyService;
    private readonly IUserService userService;
    private readonly IAuthService authService;
    private readonly ISavedSearchService savedSearchService;
    private readonly IFavoriteService favoriteService;
    private readonly ITelegramBroker telegramBroker;
    private readonly ILoggingBroker loggingBroker;

    public PropertyOrchestrationService(
        IPropertyService propertyService,
        IUserService userService,
        IAuthService authService,
        ISavedSearchService savedSearchService,
        IFavoriteService favoriteService,
        ITelegramBroker telegramBroker,
        ILoggingBroker loggingBroker)
    {
        this.propertyService = propertyService;
        this.userService = userService;
        this.authService = authService;
        this.savedSearchService = savedSearchService;
        this.favoriteService = favoriteService;
        this.telegramBroker = telegramBroker;
        this.loggingBroker = loggingBroker;
    }

    public async ValueTask<PropertyCreateResponse> AddPropertyWithUserUpgradeAsync(PropertyCreateDto dto, ClaimsPrincipal user)
    {
        // 1. Upgrade User
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        AuthResponse? newTokens = null;

        if (userIdClaim is not null && Guid.TryParse(userIdClaim, out Guid userId))
        {
            User upgradedUser = await this.userService.UpgradeToHostAsync(userId);

            if (upgradedUser.Role == UserRole.Host && upgradedUser.CurrentMode == UserRole.Host)
            {
                newTokens = await this.authService.GenerateTokensForUserAsync(userId);
            }
        }

        // 2. Add Property via Foundation Service
        var addedPropertyResponse = await this.propertyService.AddPropertyAsync(dto);
        var addedProperty = await this.propertyService.RetrievePropertyByIdAsync(addedPropertyResponse.Id);

        if (addedProperty != null)
        {
            // 3. Notify Saved Searches in background
            _ = Task.Run(() => NotifySavedSearchesAsync(addedProperty));
        }

        return new PropertyCreateResponse
        {
            Property = addedPropertyResponse,
            Tokens = newTokens
        };
    }

    public async ValueTask<Property> ModifyPropertyAsync(Property property, ClaimsPrincipal user)
    {
        // Eski narxni olib qolamiz
        var maybeProperty = await this.propertyService.RetrievePropertyByIdAsync(property.Id);
        decimal oldPrice = 0;
        if (maybeProperty != null)
        {
            oldPrice = maybeProperty.ListingType == ListingType.Sale ? (maybeProperty.SalePrice ?? 0) : (maybeProperty.MonthlyRent ?? 0);
        }

        // Foundation orqali property'ni yangilaymiz
        Property updatedProperty = await this.propertyService.ModifyPropertyAsync(property);

        decimal newPrice = updatedProperty.ListingType == ListingType.Sale ? (updatedProperty.SalePrice ?? 0) : (updatedProperty.MonthlyRent ?? 0);

        if (newPrice > 0 && newPrice < oldPrice)
        {
            // Narx tushgan bo'lsa orqa fonda xabar jo'natamiz
            _ = Task.Run(() => NotifyPriceDropAsync(updatedProperty, oldPrice, newPrice));
        }

        return updatedProperty;
    }

    private async Task NotifySavedSearchesAsync(Property property)
    {
        try
        {
            var savedSearches = this.savedSearchService.RetrieveAllSavedSearches()
                .Where(s => s.ListingType == property.ListingType && 
                            (string.IsNullOrEmpty(s.City) || s.City == property.City) &&
                            (s.MinPrice == null || property.SalePrice >= s.MinPrice || property.MonthlyRent >= s.MinPrice) &&
                            (s.MaxPrice == null || property.SalePrice <= s.MaxPrice || property.MonthlyRent <= s.MaxPrice))
                .ToList();

            foreach (var search in savedSearches)
            {
                var user = this.userService.RetrieveAllUsers().FirstOrDefault(u => u.Id == search.UserId);
                if (user != null && user.TelegramId.HasValue && user.TelegramId.Value > 0)
                {
                    string link = $"https://mulkchi.uz/properties/{property.Id}";
                    string message = $"🔔 <b>Yangi e'lon topildi!</b>\n\nSiz qidirayotgan talablarga mos keladigan yangi uy saytga joylandi:\n\n📍 {property.City}, {property.District}\n💰 Narxi: {property.SalePrice ?? property.MonthlyRent} {property.Currency}\n🛏 Xonalar: {property.NumberOfBedrooms}\n\n👉 <a href=\"{link}\">E'lonni ko'rish</a>";
                    await this.telegramBroker.SendMessageAsync(user.TelegramId.Value, message);
                }
            }
        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(ex);
        }
    }

    private async Task NotifyPriceDropAsync(Property property, decimal oldPrice, decimal newPrice)
    {
        try
        {
            var favorites = await Task.FromResult(this.favoriteService.RetrieveAllFavorites()
                .Where(f => f.PropertyId == property.Id)
                .ToList());

            foreach (var fav in favorites)
            {
                var user = this.userService.RetrieveAllUsers().FirstOrDefault(u => u.Id == fav.UserId);
                if (user != null && user.TelegramId.HasValue && user.TelegramId.Value > 0)
                {
                    string link = $"https://mulkchi.uz/properties/{property.Id}";
                    string message = $"🔥 <b>Narx arzonlashdi!</b>\n\nSiz yoqtirib qo'ygan e'lon narxi tushdi!\n\n📍 {property.Title}\n📉 Eski narx: <s>{oldPrice:N0}</s> {property.Currency}\n💰 Yangi narx: <b>{newPrice:N0}</b> {property.Currency}\n\n👉 <a href=\"{link}\">E'lonni ko'rish</a>";
                    await this.telegramBroker.SendMessageAsync(user.TelegramId.Value, message);
                }
            }
        }
        catch (Exception ex)
        {
            this.loggingBroker.LogError(ex);
        }
    }
}
