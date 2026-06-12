using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.AI;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Mulkchi.Api.Services.Foundations.Analytics;


public partial class AnalyticsService
{
    public async Task<Mulkchi.Api.Models.Foundations.Analytics.MarketOverview> GetMarketOverviewAsync()
    {
        var today = System.DateTimeOffset.UtcNow.Date;
        var yesterday = today.AddDays(-1);

        var properties = this.storageBroker.SelectAllProperties()
            .Where(p => !p.DeletedDate.HasValue)
            .AsQueryable();

        var totalListings = await properties.CountAsync();
        var totalForSale = await properties.CountAsync(p => p.ListingType == ListingType.Sale);
        var totalForRent = await properties.CountAsync(
            p => p.ListingType == ListingType.Rent || p.ListingType == ListingType.ShortTermRent);

        var salePriceQuery = properties.Where(p => p.SalePrice.HasValue && p.SalePrice > 0);
        var averageSalePrice = await salePriceQuery.AnyAsync() ? await salePriceQuery.AverageAsync(p => (decimal?)p.SalePrice) ?? 0 : 0;

        var rentPriceQuery = properties.Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0);
        var averageRentPrice = await rentPriceQuery.AnyAsync() ? await rentPriceQuery.AverageAsync(p => (decimal?)p.MonthlyRent) ?? 0 : 0;

        var newListingsToday = await properties
            .CountAsync(p => p.CreatedDate.Date == today);

        var newListingsYesterday = await properties
            .CountAsync(p => p.CreatedDate.Date == yesterday);

        var lastWeek = today.AddDays(-7);
        var newListingCountLastWeek = await properties
            .Where(p => p.CreatedDate.Date >= lastWeek && p.CreatedDate.Date < today)
            .CountAsync();
        var avgNewListingsPerDay = newListingCountLastWeek / 7.0;

        var topCity = await properties
            .GroupBy(p => p.City)
            .Select(g => new { City = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync();

        var sqmQuery = properties.Where(p => p.SalePrice.HasValue && p.SalePrice > 0 && p.Area > 0);
        var averagePricePerSqm = await sqmQuery.AnyAsync() ? await sqmQuery.AverageAsync(p => (decimal?)p.SalePrice / (decimal)p.Area) ?? 0 : 0;

        var priceChangePercent = newListingsYesterday > 0
            ? ((decimal)(newListingsToday - newListingsYesterday) / newListingsYesterday * 100m)
            : 0m;

        return new Mulkchi.Api.Models.Foundations.Analytics.MarketOverview
        {
            TotalListings = totalListings,
            TotalForSale = totalForSale,
            TotalForRent = totalForRent,
            AverageSalePrice = averageSalePrice,
            AverageRentPrice = averageRentPrice,
            NewListingsToday = newListingsToday,
            NewListingsYesterday = newListingsYesterday,
            AvgNewListingsPerDay = (int)Math.Round(avgNewListingsPerDay, 0),
            TopCity = topCity?.City ?? "Toshkent",
            TopCityCount = topCity?.Count ?? 0,
            AveragePricePerSqm = Math.Round(averagePricePerSqm, 2),
            PriceChangePercent = Math.Round(priceChangePercent, 1),
            LastUpdated = System.DateTimeOffset.UtcNow
        };
    }

    public async Task<System.Collections.Generic.IEnumerable<Mulkchi.Api.Models.Foundations.Analytics.RegionAnalytics>> GetAnalyticsByRegionAsync()
    {
        var regionData = await this.storageBroker.SelectAllProperties()
            .Where(p => !p.DeletedDate.HasValue)
            .GroupBy(p => p.Region)
            .Select(g => new Mulkchi.Api.Models.Foundations.Analytics.RegionAnalytics { 
                Region = g.Key.ToString(), 
                ListingsCount = g.Count(), 
                AverageSalePrice = g.Where(p => p.SalePrice.HasValue && p.SalePrice > 0).Average(p => (decimal?)p.SalePrice) ?? 0, 
                AverageRentPrice = g.Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0).Average(p => (decimal?)p.MonthlyRent) ?? 0 
            })
            .OrderByDescending(r => r.ListingsCount)
            .ToListAsync();

        return regionData;
    }

    public async Task<System.Collections.Generic.IEnumerable<Mulkchi.Api.Models.Foundations.Analytics.PriceTrend>> GetPriceTrendsAsync()
    {
        var twelveMonthsAgo = System.DateTimeOffset.UtcNow.AddMonths(-12);

        var monthlyData = await this.storageBroker.SelectAllProperties()
            .Where(p => !p.DeletedDate.HasValue && p.CreatedDate >= twelveMonthsAgo)
            .GroupBy(p => new { p.CreatedDate.Year, p.CreatedDate.Month })
            .Select(g => new
            {
                year = g.Key.Year,
                monthNumber = g.Key.Month,
                averagePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Average(p => (decimal?)p.SalePrice) ?? 0,
                listingsCount = g.Count()
            })
            .OrderBy(x => x.year)
            .ThenBy(x => x.monthNumber)
            .ToListAsync();

        var priceTrends = monthlyData
            .Select(item => new Mulkchi.Api.Models.Foundations.Analytics.PriceTrend
            {
                Month = $"{item.year}-{item.monthNumber:D2}",
                AveragePrice = item.averagePrice,
                ListingsCount = item.listingsCount
            })
            .ToList();

        return priceTrends;
    }

    public async Task<System.Collections.Generic.IEnumerable<Mulkchi.Api.Models.Foundations.Analytics.DistrictAnalytics>> GetAnalyticsByDistrictAsync()
    {
        var districtData = await this.storageBroker.SelectAllProperties()
            .Where(p => !p.DeletedDate.HasValue)
            .GroupBy(p => new { p.Region, p.District })
            .Select(g => new Mulkchi.Api.Models.Foundations.Analytics.DistrictAnalytics
            {
                Region = g.Key.Region.ToString(),
                District = g.Key.District,
                ListingsCount = g.Count(),
                AverageSalePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Average(p => (decimal?)p.SalePrice) ?? 0,
                AverageRentPrice = g
                    .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                    .Average(p => (decimal?)p.MonthlyRent) ?? 0,
                MinSalePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Min(p => (decimal?)p.SalePrice) ?? 0,
                MaxSalePrice = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0)
                    .Max(p => (decimal?)p.SalePrice) ?? 0,
                MinRentPrice = g
                    .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                    .Min(p => (decimal?)p.MonthlyRent) ?? 0,
                MaxRentPrice = g
                    .Where(p => p.MonthlyRent.HasValue && p.MonthlyRent > 0)
                    .Max(p => (decimal?)p.MonthlyRent) ?? 0,
                PricePerSqm = g
                    .Where(p => p.SalePrice.HasValue && p.SalePrice > 0 && p.Area > 0)
                    .Average(p => (decimal?)(p.SalePrice / (decimal)p.Area)) ?? 0
            })
            .OrderByDescending(r => r.ListingsCount)
            .ToListAsync();

        return districtData;
    }
}

