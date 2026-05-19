#nullable disable

namespace Mulkchi.Api.Models.Foundations.PropertyImages;

public class PropertyImage
{
    public Guid Id { get; set; }
    /// <summary>Full-size WebP URL (original dimensions, quality 85).</summary>
    public string Url { get; set; }
    /// <summary>Medium variant (800×600 WebP).</summary>
    public string MediumUrl { get; set; }
    /// <summary>Thumbnail variant (300×200 WebP).</summary>
    public string ThumbnailUrl { get; set; }
    public string Caption { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
    public Guid PropertyId { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
