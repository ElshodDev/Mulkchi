using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using SkiaSharp;
using System.IO;
using System.Threading.Tasks;

namespace Mulkchi.Api.Brokers.Storages;

public class LocalFileStorageBroker : IFileStorageBroker
{
    private readonly IWebHostEnvironment environment;
    private readonly string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private const long maxFileSize = 10 * 1024 * 1024;

    private const int QualityFull = 85;
    private const int QualityMedium = 80;
    private const int QualityThumbnail = 75;

    private const int ThumbWidth = 300;
    private const int ThumbHeight = 200;
    private const int MediumWidth = 800;
    private const int MediumHeight = 600;

    public LocalFileStorageBroker(IWebHostEnvironment environment)
    {
        this.environment = environment;
    }

    private string WebRootPath => this.environment.WebRootPath ?? Path.Combine(this.environment.ContentRootPath, "wwwroot");


    public async Task<string> UploadImageAsync(IFormFile file, string folder)
    {
        ValidateFile(file);
        var variants = await SaveImageVariantsAsync(file, folder);
        return variants.Full;
    }

    public async Task<ImageVariants> UploadImageVariantsAsync(IFormFile file, string folder)
    {
        ValidateFile(file);
        return await SaveImageVariantsAsync(file, folder);
    }

    public Task DeleteImageAsync(string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl))
            return Task.CompletedTask;

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

        await using var stream = file.OpenReadStream();
        using var original = SKBitmap.Decode(stream);

        if (original == null)
            throw new InvalidOperationException("Tasvirni o'qib bo'lmadi.");

        SKBitmap bitmapToSave = original;
        bool shouldDispose = false;

        if (targetWidth.HasValue && targetHeight.HasValue)
        {
            float scale = Math.Max((float)targetWidth.Value / original.Width, (float)targetHeight.Value / original.Height);
            int scaledWidth = (int)Math.Round(original.Width * scale);
            int scaledHeight = (int)Math.Round(original.Height * scale);

            var info = new SKImageInfo(targetWidth.Value, targetHeight.Value, original.ColorType, original.AlphaType);
            var cropped = new SKBitmap(info);
            using (var canvas = new SKCanvas(cropped))
            {
                int xOffset = (targetWidth.Value - scaledWidth) / 2;
                int yOffset = (targetHeight.Value - scaledHeight) / 2;
                var destRect = new SKRect(xOffset, yOffset, xOffset + scaledWidth, yOffset + scaledHeight);
                using var paint = new SKPaint { IsAntialias = true };
                canvas.DrawBitmap(original, destRect, paint);
            }

            bitmapToSave = cropped;
            shouldDispose = true;
        }

        try
        {
            using var image = SKImage.FromBitmap(bitmapToSave);
            using var data = image.Encode(SKEncodedImageFormat.Webp, quality);
            await using var outStream = File.Create(filePath);
            data.SaveTo(outStream);
        }
        finally
        {
            if (shouldDispose)
            {
                bitmapToSave.Dispose();
            }
        }

        string relativeFolder = Path.GetRelativePath(WebRootPath, uploadsFolder).Replace('\\', '/');

        return $"/{relativeFolder}/{fileName}";
    }

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
