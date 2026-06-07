using System.Security.Claims;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Services.Orchestrations.Properties;

public interface IPropertyOrchestrationService
{
    ValueTask<PropertyCreateResponse> AddPropertyWithUserUpgradeAsync(PropertyCreateDto dto, ClaimsPrincipal user);
    ValueTask<Property> ModifyPropertyAsync(Property property, ClaimsPrincipal user);
}
