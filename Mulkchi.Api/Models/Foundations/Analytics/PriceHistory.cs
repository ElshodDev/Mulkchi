using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Models.Foundations.Analytics
{
    /// <summary>
    /// Tracks historical price changes for properties
    /// Used for: Price trend analysis, market predictions
    /// </summary>
    public class PriceHistory
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        /// <summary>
        /// Price at the time of recording
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        /// <summary>
        /// Type of price: Sale, Rent, or Short-term
        /// </summary>
        public PriceType Type { get; set; }

        /// <summary>
        /// When this price was recorded
        /// </summary>
        public DateTimeOffset RecordedDate { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// Source of price change: UserUpdate, MarketAnalysis, AutoAdjustment
        /// </summary>
        [MaxLength(50)]
        public string Source { get; set; } = "UserUpdate";

        /// <summary>
        /// Previous price before this change
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? PreviousPrice { get; set; }

        /// <summary>
        /// Percentage change from previous price
        /// </summary>
        public double? ChangePercent { get; set; }
    }

    public enum PriceType
    {
        Sale = 1,
        MonthlyRent = 2,
        ShortTermRent = 3
    }
}
