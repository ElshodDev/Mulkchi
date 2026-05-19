#nullable disable

using System;
using System.ComponentModel.DataAnnotations;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Models.Foundations.SavedSearches
{
    public class SavedSearch
    {
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [StringLength(100)]
        public string City { get; set; }
        
        public PropertyType? Type { get; set; }
        
        public ListingType? ListingType { get; set; }
        
        public decimal? MinPrice { get; set; }
        
        public decimal? MaxPrice { get; set; }
        
        public double? MinArea { get; set; }
        
        public double? MaxArea { get; set; }
        
        public int? MinBedrooms { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public bool NotifyByEmail { get; set; } = true;
        
        public bool NotifyByPush { get; set; } = true;
        
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        
        public DateTimeOffset? LastNotifiedAt { get; set; }
        
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
        
        public DateTimeOffset? DeletedAt { get; set; }
    }
}
