using Mulkchi.Api.Models.Foundations.Boosts;

namespace Mulkchi.Api.Services.Foundations.Boosts;

public interface IBoostService
{
    ValueTask<BoostResponse> AddBoostAsync(BoostCreateDto dto);
    IQueryable<Boost> RetrieveAllBoosts();
    ValueTask<Boost> RetrieveBoostByIdAsync(Guid id);
    ValueTask<BoostResponse> RetrieveBoostResponseByIdAsync(Guid id);
    ValueTask<Boost> ModifyBoostAsync(Boost boost);
    ValueTask<Boost> RemoveBoostByIdAsync(Guid id);
    ValueTask<IEnumerable<BoostResponse>> RetrieveActiveBoostsByPropertyAsync(Guid propertyId);
    ValueTask<IEnumerable<BoostResponse>> RetrieveMyBoostsAsync(Guid userId);
    ValueTask<IEnumerable<BoostResponse>> RetrieveAllActiveBoostsAsync();
    ValueTask ExpireBoostsAsync();
    IEnumerable<BoostPlanDto> GetAvailablePlans();
}
