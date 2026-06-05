using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.AI
{
    public interface ISemanticSearchService
    {
        ValueTask<PropertySearchParams> ParseQueryAsync(string rawQuery);
    }
}
