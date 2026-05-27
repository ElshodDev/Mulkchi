#nullable disable

namespace Mulkchi.Api.Models.Foundations.PropertyImages;

public class PropertyImage
{
    public Guid Id { get; set; }
    public string Url { get; set; }
    public string MediumUrl { get; set; }
    public string ThumbnailUrl { get; set; }
    public string Caption { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
    public Guid PropertyId { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
