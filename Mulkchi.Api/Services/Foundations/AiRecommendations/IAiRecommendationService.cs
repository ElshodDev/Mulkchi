using Mulkchi.Api.Models.Foundations.AIs;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.AiRecommendations;

public interface IAiRecommendationService
{
    ValueTask<AiRecommendation> AddAiRecommendationAsync(AiRecommendation aiRecommendation);
    IQueryable<AiRecommendation> RetrieveAllAiRecommendations();
    ValueTask<AiRecommendation> RetrieveAiRecommendationByIdAsync(Guid aiRecommendationId);
    ValueTask<AiRecommendation> ModifyAiRecommendationAsync(AiRecommendation aiRecommendation);
    ValueTask<AiRecommendation> RemoveAiRecommendationByIdAsync(Guid aiRecommendationId);
    ValueTask<IEnumerable<HybridRecommendationResponse>> RetrieveHybridRecommendationsAsync(HybridRecommendationRequest request);
    ValueTask<IEnumerable<PropertyResponse>> GetRecommendationsForUserAsync(Guid userId, int count = 5);
}
