using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Boosts;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Auth;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Services.Foundations.Boosts;

public partial class BoostService : IBoostService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ICurrentUserService currentUserService;

    public BoostService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ICurrentUserService currentUserService)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.currentUserService = currentUserService;
    }

    public async ValueTask<BoostResponse> AddBoostAsync(BoostCreateDto dto)
    {
        var currentUserId = this.currentUserService.GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            throw new UnauthorizedAccessException("Foydalanuvchi aniqlanmadi.");
        }

        // Check if property exists and belongs to user
        var property = await this.storageBroker.SelectPropertyByIdAsync(dto.PropertyId);
        if (property is null)
        {
            throw new ArgumentException("Uy-joy topilmadi.");
        }

        if (property.HostId != currentUserId.Value && !this.currentUserService.IsInRole("Admin"))
        {
            throw new UnauthorizedAccessException("Faqat o'zingizning uy-joylaringizni ko'tarishingiz mumkin.");
        }

        // Check if property is active
        if (property.Status != PropertyStatus.Active)
        {
            throw new InvalidOperationException("Faqat faol uy-joylarni ko'tarish mumkin.");
        }

        // Check for existing active boost on this property
        var existingBoost = await this.storageBroker.SelectAllBoosts()
            .FirstOrDefaultAsync(b => b.PropertyId == dto.PropertyId && b.Status == BoostStatus.Active);

        if (existingBoost is not null)
        {
            throw new InvalidOperationException("Bu uy-joy allaqachon ko'tarilgan.");
        }

        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var (duration, price) = GetPlanDetails(dto.Plan);

        var boost = new Boost
        {
            Id = Guid.NewGuid(),
            PropertyId = dto.PropertyId,
            UserId = currentUserId.Value,
            Plan = dto.Plan,
            Amount = price,
            StartDate = now,
            EndDate = now.AddDays(duration),
            Status = BoostStatus.Active,
            CreatedDate = now
        };

        var addedBoost = await this.storageBroker.InsertBoostAsync(boost);
        return await ToBoostResponseAsync(addedBoost);
    }

    public async ValueTask<Boost> AddBoostAsync(Boost boost) =>
        await TryCatch(async () =>
        {
            ValidateBoostOnAdd(boost);
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            boost.CreatedDate = now;
            boost.StartDate = now;
            return await this.storageBroker.InsertBoostAsync(boost);
        });

    public IQueryable<Boost> RetrieveAllBoosts() =>
        TryCatch(() => this.storageBroker.SelectAllBoosts());

    public async ValueTask<Boost> RetrieveBoostByIdAsync(Guid id)
    {
        ValidateBoostId(id);
        var boost = await this.storageBroker.SelectBoostByIdAsync(id);
        if (boost is null)
            throw new ArgumentException($"Boost with id '{id}' not found.");
        return boost;
    }

    public async ValueTask<BoostResponse> RetrieveBoostResponseByIdAsync(Guid id)
    {
        var boost = await RetrieveBoostByIdAsync(id);
        return await ToBoostResponseAsync(boost);
    }

    public async ValueTask<Boost> ModifyBoostAsync(Boost boost) =>
        await TryCatch(async () =>
        {
            ValidateBoostOnModify(boost);
            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && boost.UserId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("Siz faqat o'zingizning boostlaringizni tahrirlashingiz mumkin.");
            }
            boost.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            return await this.storageBroker.UpdateBoostAsync(boost);
        });

    public async ValueTask<Boost> RemoveBoostByIdAsync(Guid id) =>
        await TryCatch(async () =>
        {
            ValidateBoostId(id);
            var boost = await this.storageBroker.SelectBoostByIdAsync(id);
            if (boost is null)
                throw new ArgumentException($"Boost with id '{id}' not found.");

            var currentUserId = this.currentUserService.GetCurrentUserId();
            if (!currentUserId.HasValue || (!this.currentUserService.IsInRole("Admin") && boost.UserId != currentUserId.Value))
            {
                throw new UnauthorizedAccessException("Siz faqat o'zingizning boostlaringizni o'chirishingiz mumkin.");
            }

            // Soft delete - mark as cancelled
            boost.Status = BoostStatus.Cancelled;
            boost.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            boost.DeletedDate = boost.UpdatedDate;
            return await this.storageBroker.UpdateBoostAsync(boost);
        });

    public async ValueTask<IEnumerable<BoostResponse>> RetrieveActiveBoostsByPropertyAsync(Guid propertyId)
    {
        var boosts = await this.storageBroker.SelectAllBoosts()
            .Where(b => b.PropertyId == propertyId && b.Status == BoostStatus.Active)
            .ToListAsync();

        var tasks = boosts.Select(b => ToBoostResponseAsync(b));
        return await Task.WhenAll(tasks);
    }

    public async ValueTask<IEnumerable<BoostResponse>> RetrieveMyBoostsAsync(Guid userId)
    {
        var boosts = await this.storageBroker.SelectAllBoosts()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedDate)
            .ToListAsync();

        var tasks = boosts.Select(b => ToBoostResponseAsync(b));
        return await Task.WhenAll(tasks);
    }

    public async ValueTask<IEnumerable<BoostResponse>> RetrieveAllActiveBoostsAsync()
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var boosts = await this.storageBroker.SelectAllBoosts()
            .Where(b => b.Status == BoostStatus.Active && b.EndDate > now)
            .OrderByDescending(b => b.Plan) // Gold first, then Silver, then Bronze
            .ThenByDescending(b => b.StartDate)
            .ToListAsync();

        var tasks = boosts.Select(b => ToBoostResponseAsync(b));
        return await Task.WhenAll(tasks);
    }

    public async ValueTask ExpireBoostsAsync()
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var expiredBoosts = await this.storageBroker.SelectAllBoosts()
            .Where(b => b.Status == BoostStatus.Active && b.EndDate <= now)
            .ToListAsync();

        foreach (var boost in expiredBoosts)
        {
            boost.Status = BoostStatus.Expired;
            boost.UpdatedDate = now;
            await this.storageBroker.UpdateBoostAsync(boost);
        }
    }

    public IEnumerable<BoostPlanDto> GetAvailablePlans()
    {
        return new List<BoostPlanDto>
        {
            new BoostPlanDto
            {
                Plan = BoostPlan.Bronze,
                Name = "Bronze",
                NameUz = "Bronza",
                NameRu = "Бронза",
                DurationDays = 1,
                Price = 10000,
                Description = "1 day boost - 10,000 UZS",
                DescriptionUz = "1 kunlik ko'tarish - 10,000 so'm",
                DescriptionRu = "Поднятие на 1 день - 10,000 сум"
            },
            new BoostPlanDto
            {
                Plan = BoostPlan.Silver,
                Name = "Silver",
                NameUz = "Kumush",
                NameRu = "Серебро",
                DurationDays = 3,
                Price = 25000,
                Description = "3 days boost - 25,000 UZS (17% discount)",
                DescriptionUz = "3 kunlik ko'tarish - 25,000 so'm (17% chegirma)",
                DescriptionRu = "Поднятие на 3 дня - 25,000 сум (скидка 17%)"
            },
            new BoostPlanDto
            {
                Plan = BoostPlan.Gold,
                Name = "Gold",
                NameUz = "Oltin",
                NameRu = "Золото",
                DurationDays = 7,
                Price = 50000,
                Description = "7 days boost - 50,000 UZS (29% discount)",
                DescriptionUz = "7 kunlik ko'tarish - 50,000 so'm (29% chegirma)",
                DescriptionRu = "Поднятие на 7 дней - 50,000 сум (скидка 29%)"
            }
        };
    }

    private static (int Duration, decimal Price) GetPlanDetails(BoostPlan plan)
    {
        return plan switch
        {
            BoostPlan.Bronze => (1, 10000m),
            BoostPlan.Silver => (3, 25000m),
            BoostPlan.Gold => (7, 50000m),
            _ => throw new ArgumentException("Invalid boost plan")
        };
    }

    private async Task<BoostResponse> ToBoostResponseAsync(Boost boost)
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        var daysRemaining = boost.EndDate > now ? (int)(boost.EndDate - now).TotalDays : 0;

        var property = await this.storageBroker.SelectPropertyByIdAsync(boost.PropertyId);
        var user = await this.storageBroker.SelectUserByIdAsync(boost.UserId);

        return new BoostResponse
        {
            Id = boost.Id,
            PropertyId = boost.PropertyId,
            PropertyTitle = property?.Title ?? "Unknown",
            UserId = boost.UserId,
            UserName = user is not null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown",
            Plan = boost.Plan,
            PlanName = boost.Plan.ToString(),
            Amount = boost.Amount,
            StartDate = boost.StartDate,
            EndDate = boost.EndDate,
            Status = boost.Status,
            DaysRemaining = daysRemaining,
            CreatedDate = boost.CreatedDate
        };
    }
}
