using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Mulkchi.Api.Models.Foundations.Analytics
{
    /// <summary>
    /// Pre-calculated market trends for regions/districts
    /// Used for: Quick trend lookups, charts, forecasting
    /// </summary>
    public class MarketTrend
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Region (e.g., "ToshkentShahar", "Samarqand")
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Region { get; set; }

        /// <summary>
        /// District (e.g., "Yunusobod", "Mirzo-Ulugbek")
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string District { get; set; }

        /// <summary>
        /// Property type (Apartment, House, etc.)
        /// </summary>
        [MaxLength(50)]
        public string PropertyType { get; set; }

        /// <summary>
        /// Year-Month for this trend data
        /// </summary>
        [Required]
        [MaxLength(7)] // Format: "2024-01"
        public string YearMonth { get; set; }

        /// <summary>
        /// Average sale price this month
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageSalePrice { get; set; }

        /// <summary>
        /// Average rent price this month
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageRentPrice { get; set; }

        /// <summary>
        /// Average price per square meter
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerSqm { get; set; }

        /// <summary>
        /// Number of properties listed this month
        /// </summary>
        public int ListingsCount { get; set; }

        /// <summary>
        /// Number of properties sold/rented this month
        /// </summary>
        public int TransactionsCount { get; set; }

        /// <summary>
        /// Price change percent from previous month
        /// </summary>
        public double PriceChangePercent { get; set; }

        /// <summary>
        /// Days on market (average)
        /// </summary>
        public double AverageDaysOnMarket { get; set; }

        /// <summary>
        /// Market sentiment: Hot, Warm, Cool, Cold
        /// </summary>
        [MaxLength(20)]
        public string MarketSentiment { get; set; } = "Stable";

        /// <summary>
        /// When this trend record was calculated
        /// </summary>
        public DateTimeOffset CalculatedAt { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// Data points used for calculation
        /// </summary>
        public int DataPointsUsed { get; set; }
    }
}
