using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Models.Foundations.Analytics
{
    public class PriceHistory
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public PriceType Type { get; set; }

        public DateTimeOffset RecordedDate { get; set; } = DateTimeOffset.UtcNow;

        [MaxLength(50)]
        public string Source { get; set; } = "UserUpdate";

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PreviousPrice { get; set; }

        public double? ChangePercent { get; set; }
    }

    public enum PriceType
    {
        Sale = 1,
        MonthlyRent = 2,
        ShortTermRent = 3
    }
}
