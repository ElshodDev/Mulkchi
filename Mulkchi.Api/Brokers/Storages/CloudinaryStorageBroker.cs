using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Mulkchi.Api.Brokers.Storages;

public class CloudinaryStorageBroker : IFileStorageBroker
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryStorageBroker> _logger;

    public CloudinaryStorageBroker(IConfiguration configuration, ILogger<CloudinaryStorageBroker> logger)
    {
        _logger = logger;
        
        var cloudinaryUrl = Environment.GetEnvironmentVariable("CLOUDINARY_URL") ?? configuration["Cloudinary:Url"];
        if (string.IsNullOrWhiteSpace(cloudinaryUrl))
        {
            _logger.LogWarning("Cloudinary URL not found. Image uploads will fail.");
        }
        else
        {
            _cloudinary = new Cloudinary(cloudinaryUrl);
        }
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder)
    {
        if (file == null || file.Length == 0) return string.Empty;

        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
        return uploadResult.SecureUrl.ToString();
    }

    public async Task<ImageVariants> UploadImageVariantsAsync(IFormFile file, string folder)
    {
        if (file == null || file.Length == 0) return new ImageVariants(string.Empty, string.Empty, string.Empty);

        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
        
        var baseUrl = uploadResult.SecureUrl.ToString();
        var publicId = uploadResult.PublicId;

        var thumbnail = _cloudinary.Api.UrlImgUp.Transform(new Transformation().Width(200).Height(200).Crop("fill")).BuildUrl(publicId);
        var medium = _cloudinary.Api.UrlImgUp.Transform(new Transformation().Width(800).Crop("scale")).BuildUrl(publicId);
        
        return new ImageVariants(thumbnail, medium, baseUrl);
    }

    public async Task DeleteImageAsync(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return;

        try
        {
            var uri = new Uri(imageUrl);
            var path = uri.AbsolutePath;
            var parts = path.Split('/');
            
            // Cloudinary paths look like: /v1234567/folder/image.jpg
            var uploadIndex = Array.IndexOf(parts, "upload");
            if (uploadIndex == -1) return;

            // skip 'upload' and version 'v1234'
            var publicIdWithExtension = string.Join("/", parts.Skip(uploadIndex + 2));
            var lastDot = publicIdWithExtension.LastIndexOf('.');
            var publicId = lastDot > 0 ? publicIdWithExtension.Substring(0, lastDot) : publicIdWithExtension;

            var deletionParams = new DeletionParams(publicId);
            await _cloudinary.DestroyAsync(deletionParams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete image from Cloudinary: {Url}", imageUrl);
        }
    }

    public async ValueTask<string> UploadFileAsync(IFormFile file, string path)
    {
        return await UploadImageAsync(file, path);
    }

    public ValueTask DeleteFileAsync(string filePath)
    {
        return new ValueTask(DeleteImageAsync(filePath));
    }
}
