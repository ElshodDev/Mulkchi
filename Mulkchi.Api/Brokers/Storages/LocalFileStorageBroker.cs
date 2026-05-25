using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using System.IO;
using System.Threading.Tasks;

namespace Mulkchi.Api.Brokers.Storages;

/// <summary>
/// Stores uploaded images locally, converting them to WebP and producing
/// three size variants: thumbnail (300×200), medium (800×600), full (original
/// dimensions at quality 85).  Falls back to the raw file for non-image uploads.
/// </summary>
public class LocalFileStorageBroker : IFileStorageBroker
{
    private readonly IWebHostEnvironment environment;
    private readonly string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private const long maxFileSize = 10 * 1024 * 1024; // 10 MB

    // WebP encode quality levels
    private const int QualityFull = 85;
    private const int QualityMedium = 80;
    private const int QualityThumbnail = 75;

    // Thumbnail / medium dimensions
    private const int ThumbWidth = 300;
    private const int ThumbHeight = 200;
    private const int MediumWidth = 800;
    private const int MediumHeight = 600;

    public LocalFileStorageBroker(IWebHostEnvironment environment)
    {
        this.environment = environment;
    }

    private string WebRootPath => this.environment.WebRootPath ?? Path.Combine(this.environment.ContentRootPath, "wwwroot");

    // ─── IFileStorageBroker ───────────────────────────────────────────────

    /// <inheritdoc />
    public async Task<string> UploadImageAsync(IFormFile file, string folder)
    {
        ValidateFile(file);
        var variants = await SaveImageVariantsAsync(file, folder);
        return variants.Full;
    }

    /// <inheritdoc />
    public async Task<ImageVariants> UploadImageVariantsAsync(IFormFile file, string folder)
    {
        ValidateFile(file);
        return await SaveImageVariantsAsync(file, folder);
    }

    public Task DeleteImageAsync(string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl))
            return Task.CompletedTask;

        // Delete all three variants if they exist
        foreach (var suffix in new[] { "", "-medium", "-thumb" })
        {
            var candidate = AppendSuffix(imageUrl, suffix);
            var fullPath = Path.Combine(WebRootPath, candidate.TrimStart('/'));
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    public async ValueTask<string> UploadFileAsync(IFormFile file, string path)
    {
        var uploadsFolder = Path.Combine(WebRootPath, path);
        Directory.CreateDirectory(uploadsFolder);

        string uniqueFileName = $"{System.Guid.NewGuid()}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        string filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using var fileStream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(fileStream);

        return $"/{path}/{uniqueFileName}";
    }

    public ValueTask DeleteFileAsync(string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
            return ValueTask.CompletedTask;

        string fullPath = Path.Combine(WebRootPath, filePath.TrimStart('/'));

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return ValueTask.CompletedTask;
    }

    // ─── Private helpers ──────────────────────────────────────────────────

    private async Task<ImageVariants> SaveImageVariantsAsync(IFormFile file, string folder)
    {
        string uploadsFolder = Path.Combine(WebRootPath, "uploads", folder);
        Directory.CreateDirectory(uploadsFolder);

        string baseName = System.Guid.NewGuid().ToString();

        string fullUrl = await SaveVariantAsync(file, uploadsFolder, baseName, "full", null, null, QualityFull);
        string mediumUrl = await SaveVariantAsync(file, uploadsFolder, baseName, "medium", MediumWidth, MediumHeight, QualityMedium);
        string thumbnailUrl = await SaveVariantAsync(file, uploadsFolder, baseName, "thumb", ThumbWidth, ThumbHeight, QualityThumbnail);

        return new ImageVariants(Thumbnail: thumbnailUrl, Medium: mediumUrl, Full: fullUrl);
    }

    private async Task<string> SaveVariantAsync(
        IFormFile file,
        string uploadsFolder,
        string baseName,
        string variantSuffix,
        int? targetWidth,
        int? targetHeight,
        int quality)
    {
        string fileName = $"{baseName}-{variantSuffix}.webp";
        string filePath = Path.Combine(uploadsFolder, fileName);

        using var stream = file.OpenReadStream();
        using var image = await Image.LoadAsync(stream);

        if (targetWidth.HasValue && targetHeight.HasValue)
        {
            // Resize while preserving aspect ratio, then crop to exact target
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(targetWidth.Value, targetHeight.Value),
                Mode = ResizeMode.Crop,
            }));
        }

        var encoder = new WebpEncoder { Quality = quality };
        await image.SaveAsync(filePath, encoder);

        // Derive the folder name from the full path to keep it relative
        string relativeFolder = Path.GetRelativePath(WebRootPath, uploadsFolder).Replace('\\', '/');

        return $"/{relativeFolder}/{fileName}";
    }

    /// <summary>
    /// Inserts <paramref name="suffix"/> before the file extension in <paramref name="url"/>.
    /// Used when trying to locate variant files during deletion.
    /// </summary>
    private static string AppendSuffix(string url, string suffix)
    {
        if (string.IsNullOrEmpty(suffix)) return url;

        var ext = Path.GetExtension(url);
        var base_ = url[..^ext.Length];
        return $"{base_}{suffix}{ext}";
    }

    private void ValidateFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Fayl talab qilinadi.");

        if (file.Length > maxFileSize)
            throw new BadHttpRequestException(
                $"Fayl hajmi {maxFileSize / (1024 * 1024)} MB dan oshmasligi kerak.",
                StatusCodes.Status413RequestEntityTooLarge);

        string fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(fileExtension))
            throw new ArgumentException($"Faqat {string.Join(", ", allowedExtensions)} formatlar qabul qilinadi.");
    }
}
