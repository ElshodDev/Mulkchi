using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.DataSeed;
using Mulkchi.Api.Models.Foundations.Properties;

#pragma warning disable CS1591

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;

    /// <summary>Initializes SeedController.</summary>
    public SeedController(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    /// <summary>Seeds demo data.</summary>
    [HttpPost]
    public async Task<IActionResult> SeedProductionData()
    {
        try
        {
            await DevelopmentDataSeeder.SeedProductionAsync(_serviceProvider);
            return Ok(new { message = "Seeding completed successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error during seeding", error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>Resets and re-seeds demo data.</summary>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetAndReseed()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<StorageBroker>();

            // Get demo property IDs
            var demoPropIds = await db.Properties
                .Where(p => p.Description == "Yaxshi joylashuv")
                .Select(p => p.Id)
                .ToListAsync();

            // Get demo user IDs
            var demoUserIds = await db.Users
                .Where(u => u.Email != null && u.Email.EndsWith("@demo.mulkchi.uz"))
                .Select(u => u.Id)
                .ToListAsync();

            // Delete child records of demo properties
            await db.Bookings.Where(b => demoPropIds.Contains(b.PropertyId)).ExecuteDeleteAsync();
            await db.Reviews.Where(r => demoPropIds.Contains(r.PropertyId)).ExecuteDeleteAsync();
            await db.Favorites.Where(f => demoPropIds.Contains(f.PropertyId)).ExecuteDeleteAsync();
            await db.PropertyImages.Where(i => demoPropIds.Contains(i.PropertyId)).ExecuteDeleteAsync();
            await db.PropertyViews.Where(v => demoPropIds.Contains(v.PropertyId)).ExecuteDeleteAsync();
            await db.PropertyAmenities.Where(a => demoPropIds.Contains(a.PropertyId)).ExecuteDeleteAsync();

            // Delete demo properties
            int deletedProperties = await db.Properties
                .Where(p => demoPropIds.Contains(p.Id))
                .ExecuteDeleteAsync();

            // Delete child records of demo users
            await db.Bookings.Where(b => demoUserIds.Contains(b.GuestId)).ExecuteDeleteAsync();
            await db.Reviews.Where(r => demoUserIds.Contains(r.ReviewerId)).ExecuteDeleteAsync();
            await db.UserSubscriptions.Where(s => demoUserIds.Contains(s.UserId)).ExecuteDeleteAsync();

            // Delete demo users
            int deletedUsers = await db.Users
                .Where(u => demoUserIds.Contains(u.Id))
                .ExecuteDeleteAsync();

            await db.Discounts.Where(d => d.Code != null && d.Code.StartsWith("DEMO")).ExecuteDeleteAsync();

            // Re-seed
            await DevelopmentDataSeeder.SeedProductionAsync(_serviceProvider);

            return Ok(new { message = "Reset completed.", deletedProperties, deletedUsers });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error during reset", error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>Updates prices of existing demo properties.</summary>
    [HttpPost("fix-prices")]
    public async Task<IActionResult> FixPrices()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<StorageBroker>();

            var properties = await db.Properties
                .Where(p => p.Description == "Yaxshi joylashuv")
                .ToListAsync();

            foreach (var p in properties)
            {
                int beds = p.NumberOfBedrooms;
                decimal baseRentUsd = beds == 1 ? 250m : beds == 2 ? 350m : 450m;
                decimal baseSaleUsd = beds == 1 ? 35000m : beds == 2 ? 50000m : 70000m;
                decimal baseNightUsd = beds == 1 ? 25m : beds == 2 ? 35m : 50m;

                if (p.District == "Mirobod" || p.District == "Yakkasaroy" ||
                    p.District == "Mirzo Ulug'bek" || p.District == "Shayxontohur")
                {
                    baseRentUsd *= 1.3m; baseSaleUsd *= 1.3m; baseNightUsd *= 1.3m;
                }
                else if (p.District == "Sergeli" || p.District == "Uchtepa")
                {
                    baseRentUsd *= 0.9m; baseSaleUsd *= 0.9m; baseNightUsd *= 0.9m;
                }

                if (p.BuildingType == BuildingType.NewBuilding)
                { baseRentUsd *= 1.2m; baseSaleUsd *= 1.2m; baseNightUsd *= 1.2m; }

                if (p.District == "Olmazor" && beds >= 3 && p.BuildingType == BuildingType.OldBuilding)
                    baseRentUsd = 350m;
                if (p.District == "Sergeli" && beds == 2 && p.BuildingType == BuildingType.NewBuilding)
                    baseRentUsd = 380m;

                int seed = Math.Abs(p.Id.GetHashCode());
                p.MonthlyRent = p.ListingType == ListingType.Rent
                    ? Math.Round((baseRentUsd * 12600m) + (seed % 5) * 50_000m) : null;
                p.SalePrice = p.ListingType == ListingType.Sale
                    ? Math.Round((baseSaleUsd * 12600m) + (seed % 7) * 2_000_000m) : null;
                p.PricePerNight = p.ListingType == ListingType.ShortTermRent
                    ? Math.Round((baseNightUsd * 12600m) + (seed % 3) * 10_000m) : null;
                p.Price = p.SalePrice ?? p.MonthlyRent ?? p.PricePerNight ?? 0m;
                p.SecurityDeposit = p.ListingType == ListingType.Rent ? p.MonthlyRent * 1.5m : null;
            }

            await db.SaveChangesAsync();
            return Ok(new { message = "Prices updated successfully.", count = properties.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fixing prices", error = ex.Message, inner = ex.InnerException?.Message });
        }
    }
}
