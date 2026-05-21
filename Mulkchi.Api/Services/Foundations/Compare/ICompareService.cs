using Mulkchi.Api.Models.Foundations.Compare;

namespace Mulkchi.Api.Services.Foundations.Compare;

public interface ICompareService
{
    ValueTask<ComparisonResult> ComparePropertiesAsync(List<Guid> propertyIds);
    ValueTask<string> GenerateComparisonSummaryAsync(List<Guid> propertyIds);
}
