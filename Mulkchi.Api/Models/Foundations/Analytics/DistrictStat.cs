using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Mulkchi.Api.Models.Foundations.Analytics
{
    public class DistrictStat
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(50)]
        public string Region { get; set; }

        [Required]
        [MaxLength(100)]
        public string District { get; set; }

        public DateTimeOffset CalculatedAt { get; set; } = DateTimeOffset.UtcNow;


        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageSalePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MedianSalePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinSalePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MaxSalePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceQuartile25 { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceQuartile75 { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerSqm { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AverageRentPrice { get; set; }

        public decimal RentalYieldPercent { get; set; }


        public int TotalListings { get; set; }

        public int NewListingsThisMonth { get; set; }

        public int ClosedListingsThisMonth { get; set; }

        public double AverageDaysOnMarket { get; set; }


        public int ApartmentCount { get; set; }

        public int HouseCount { get; set; }

        public int CommercialCount { get; set; }

        public int LandCount { get; set; }


        [Column(TypeName = "decimal(5,2)")]
        public decimal OverallScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal AffordabilityScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal InfrastructureScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ConnectivityScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal AmenitiesScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal SafetyScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal InvestmentPotentialScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal GrowthScore { get; set; }


        public double WifiCoveragePercent { get; set; }

        public double ParkingCoveragePercent { get; set; }

        public double MetroCoveragePercent { get; set; }

        public double SchoolCoveragePercent { get; set; }

        public double MarketCoveragePercent { get; set; }

        public double HospitalCoveragePercent { get; set; }

        [MaxLength(500)]
        public string Summary { get; set; }
    }
}
