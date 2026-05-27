using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Mulkchi.Api.Models.Foundations.Analytics
{
    public class MarketTrend
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(50)]
        public string Region { get; set; }

        [Required]
        [MaxLength(100)]
        public string District { get; set; }

        [MaxLength(50)]
        public string PropertyType { get; set; }

        [Required]
        [MaxLength(7)]
        public string YearMonth { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageSalePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageRentPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerSqm { get; set; }

        public int ListingsCount { get; set; }

        public int TransactionsCount { get; set; }

        public double PriceChangePercent { get; set; }

        public double AverageDaysOnMarket { get; set; }

        [MaxLength(20)]
        public string MarketSentiment { get; set; } = "Stable";

        public DateTimeOffset CalculatedAt { get; set; } = DateTimeOffset.UtcNow;

        public int DataPointsUsed { get; set; }
    }
}
