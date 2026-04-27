using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Search;

public interface IMeiliPropertySearchService
{
    ValueTask<(IReadOnlyList<Guid> PropertyIds, int TotalCount)> SearchAsync(
        string query,
        int limit,
        CancellationToken cancellationToken = default);
}
