using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Mulkchi.Api.Brokers.Storages;

public interface IFileStorageBroker
{
    Task<string> UploadImageAsync(IFormFile file, string folder);

    Task<ImageVariants> UploadImageVariantsAsync(IFormFile file, string folder);

    Task DeleteImageAsync(string imageUrl);
    ValueTask<string> UploadFileAsync(IFormFile file, string path);
    ValueTask DeleteFileAsync(string filePath);
}

public record ImageVariants(string Thumbnail, string Medium, string Full);
