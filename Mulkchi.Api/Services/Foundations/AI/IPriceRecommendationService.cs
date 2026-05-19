using Mulkchi.Api.Models.Foundations.AI;

namespace Mulkchi.Api.Services.Foundations.AI;

public interface IPriceRecommendationService
{
    Task<PriceRecommendationResponse> PredictPriceAsync(PriceRecommendationRequest request);
    Task TrainModelAsync();
    Task<bool> IsModelTrainedAsync();
    Task<int> GetTrainingDataCountAsync();
}
