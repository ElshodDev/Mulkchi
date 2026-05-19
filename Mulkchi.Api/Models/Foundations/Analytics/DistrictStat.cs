using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Mulkchi.Api.Models.Foundations.Analytics
{
    /// <summary>
    /// Pre-calculated statistics for each district
    /// Used for: Location intelligence, quick comparisons
    /// </summary>
    public class DistrictStat
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Region name
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Region { get; set; }

        /// <summary>
        /// District name
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string District { get; set; }

        /// <summary>
        /// When stats were last calculated
        /// </summary>
        public DateTimeOffset CalculatedAt { get; set; } = DateTimeOffset.UtcNow;

        // ========== PRICE STATISTICS ==========

        /// <summary>
        /// Average sale price in district
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageSalePrice { get; set; }

        /// <summary>
        /// Median sale price (more reliable than average)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MedianSalePrice { get; set; }

        /// <summary>
        /// Minimum sale price
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MinSalePrice { get; set; }

        /// <summary>
        /// Maximum sale price
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MaxSalePrice { get; set; }

        /// <summary>
        /// 25th percentile (Q1)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceQuartile25 { get; set; }

        /// <summary>
        /// 75th percentile (Q3)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceQuartile75 { get; set; }

        /// <summary>
        /// Average price per square meter
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerSqm { get; set; }

        /// <summary>
        /// Average rent price
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageRentPrice { get; set; }

        /// <summary>
        /// Rental yield percentage
        /// </summary>
        public decimal RentalYieldPercent { get; set; }

        // ========== LISTING STATISTICS ==========

        /// <summary>
        /// Total active listings
        /// </summary>
        public int TotalListings { get; set; }

        /// <summary>
        /// New listings this month
        /// </summary>
        public int NewListingsThisMonth { get; set; }

        /// <summary>
        /// Listings sold/rented this month
        /// </summary>
        public int ClosedListingsThisMonth { get; set; }

        /// <summary>
        /// Average days on market
        /// </summary>
        public double AverageDaysOnMarket { get; set; }

        // ========== PROPERTY TYPE BREAKDOWN ==========

        /// <summary>
        /// Number of apartments
        /// </summary>
        public int ApartmentCount { get; set; }

        /// <summary>
        /// Number of houses
        /// </summary>
        public int HouseCount { get; set; }

        /// <summary>
        /// Number of commercial properties
        /// </summary>
        public int CommercialCount { get; set; }

        /// <summary>
        /// Number of land plots
        /// </summary>
        public int LandCount { get; set; }

        // ========== LOCATION SCORES (0-100) ==========

        /// <summary>
        /// Overall living score (calculated)
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal OverallScore { get; set; }

        /// <summary>
        /// Affordability score
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal AffordabilityScore { get; set; }

        /// <summary>
        /// Infrastructure quality score
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal InfrastructureScore { get; set; }

        /// <summary>
        /// Transport connectivity score
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal ConnectivityScore { get; set; }

        /// <summary>
        /// Amenities availability score
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal AmenitiesScore { get; set; }

        /// <summary>
        /// Safety/security score
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal SafetyScore { get; set; }

        /// <summary>
        /// Investment potential score
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal InvestmentPotentialScore { get; set; }

        /// <summary>
        /// Price growth score
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal GrowthScore { get; set; }

        // ========== AMENITIES STATISTICS ==========

        /// <summary>
        /// Percentage of properties with WiFi
        /// </summary>
        public double WifiCoveragePercent { get; set; }

        /// <summary>
        /// Percentage of properties with parking
        /// </summary>
        public double ParkingCoveragePercent { get; set; }

        /// <summary>
        /// Percentage near metro
        /// </summary>
        public double MetroCoveragePercent { get; set; }

        /// <summary>
        /// Percentage near schools
        /// </summary>
        public double SchoolCoveragePercent { get; set; }

        /// <summary>
        /// Percentage near markets
        /// </summary>
        public double MarketCoveragePercent { get; set; }

        /// <summary>
        /// Percentage near hospitals
        /// </summary>
        public double HospitalCoveragePercent { get; set; }

        /// <summary>
        /// Human-readable summary
        /// </summary>
        [MaxLength(500)]
        public string Summary { get; set; }
    }
}
