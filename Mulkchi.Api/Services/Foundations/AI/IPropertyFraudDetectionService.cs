using System;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.AI
{
    public interface IPropertyFraudDetectionService
    {
        Task<FraudAssessmentResult> AssessPropertyRiskAsync(Property property);
        Task<FraudAssessmentResult> AssessPropertyRiskByIdAsync(Guid propertyId);
    }
}
