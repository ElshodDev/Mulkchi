using System.Net.Http.Json;
using System.Text.Json;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Search;

public sealed class MeiliPropertySearchService : IMeiliPropertySearchService
{
    private readonly IHttpClientFactory httpClientFactory;
    private readonly IConfiguration configuration;

    public MeiliPropertySearchService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        this.httpClientFactory = httpClientFactory;
        this.configuration = configuration;
    }

    public async ValueTask<(IReadOnlyList<Guid> PropertyIds, int TotalCount)> SearchAsync(
        string query,
        int limit,
        CancellationToken cancellationToken = default)
    {
        string? baseUrl = this.configuration["MeiliSearch:Url"];
        string? apiKey = this.configuration["MeiliSearch:ApiKey"];
        string indexName = this.configuration["MeiliSearch:PropertiesIndex"] ?? "properties";

        if (string.IsNullOrWhiteSpace(baseUrl))
            return (Array.Empty<Guid>(), 0);

        var client = this.httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            client.DefaultRequestHeaders.Remove("Authorization");
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        }

        var requestBody = new
        {
            q = query,
            limit,
            attributesToRetrieve = new[] { "id" }
        };

        using var response = await client.PostAsJsonAsync(
            $"indexes/{indexName}/search",
            requestBody,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
            return (Array.Empty<Guid>(), 0);

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var hits = document.RootElement.GetProperty("hits");
        var ids = new List<Guid>(hits.GetArrayLength());

        foreach (JsonElement hit in hits.EnumerateArray())
        {
            if (!hit.TryGetProperty("id", out JsonElement idElement))
                continue;

            string? idString = idElement.GetString();
            if (Guid.TryParse(idString, out Guid id))
                ids.Add(id);
        }

        int total = 0;
        if (document.RootElement.TryGetProperty("estimatedTotalHits", out JsonElement totalElement))
            total = totalElement.GetInt32();

        return (ids, total);
    }
}
