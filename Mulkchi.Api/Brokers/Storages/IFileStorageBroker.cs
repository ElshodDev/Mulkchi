using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Mulkchi.Api.Brokers.Storages;

public interface IFileStorageBroker
{
    /// <summary>
    /// Uploads an image, converts it to WebP, and saves thumbnail (300×200),
    /// medium (800×600), and full (original dimensions, quality 85) variants.
    /// Returns the URL of the full-size variant.
    /// </summary>
    Task<string> UploadImageAsync(IFormFile file, string folder);

    /// <summary>
    /// Returns the URL suffixes for all size variants of the stored image.
    /// Key = size name ("thumbnail" | "medium" | "full"), Value = URL.
    /// </summary>
    Task<ImageVariants> UploadImageVariantsAsync(IFormFile file, string folder);

    Task DeleteImageAsync(string imageUrl);
    ValueTask<string> UploadFileAsync(IFormFile file, string path);
    ValueTask DeleteFileAsync(string filePath);
}

/// <summary>Holds the three URL variants produced for every uploaded property image.</summary>
public record ImageVariants(string Thumbnail, string Medium, string Full);
