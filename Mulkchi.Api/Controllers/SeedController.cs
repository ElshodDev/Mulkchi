using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.DataSeed;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Controllers;

#pragma warning disable CS1591

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;

    /// <summary>Initializes a new instance of SeedController.</summary>
    public SeedController(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    /// <summary>Seeds demo data into the database.</summary>
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
            return StatusCode(500, new { message = "Error during seeding", error = ex.Message });
        }
    }

    /// <summary>Resets demo data and re-seeds.</summary>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetAndReseed()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<StorageBroker>();

            await dbContext.Bookings.Where(b => b.Property!.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.Reviews.Where(r => r.Property!.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.Favorites.Where(f => f.Property!.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.Discounts.Where(d => d.Code!.StartsWith("DEMO")).ExecuteDeleteAsync();
            await dbContext.PropertyImages.Where(pi => pi.Property!.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.PropertyAmenities.Where(pa => pa.Property!.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.PropertyViews.Where(pv => pv.Property!.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();

            int deletedProperties = await dbContext.Properties
                .Where(p => p.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();

            await dbContext.Bookings.Where(b => b.Guest!.Email != null && b.Guest.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();
            await dbContext.Reviews.Where(r => r.Reviewer!.Email != null && r.Reviewer.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();
            await dbContext.UserSubscriptions.Where(s => s.User!.Email != null && s.User.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();

            int deletedUsers = await dbContext.Users
                .Where(u => u.Email != null && u.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();

            await DevelopmentDataSeeder.SeedProductionAsync(_serviceProvider);

            return Ok(new
            {
                message = "Reset and re-seeding completed successfully.",
                deletedProperties,
                deletedUsers
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Error during reset",
                error = ex.Message,
                innerError = ex.InnerException?.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    /// <summary>Updates property prices in-place without deleting data.</summary>
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
                {
                    baseRentUsd *= 1.2m; baseSaleUsd *= 1.2m; baseNightUsd *= 1.2m;
                }

                if (p.District == "Olmazor" && beds >= 3 && p.BuildingType == BuildingType.OldBuilding)
                    baseRentUsd = 350m;

                if (p.District == "Sergeli" && beds == 2 && p.BuildingType == BuildingType.NewBuilding)
                    baseRentUsd = 380m;

                int hashSeed = Math.Abs(p.Id.GetHashCode());

                p.MonthlyRent = p.ListingType == ListingType.Rent
                    ? Math.Round((baseRentUsd * 12600m) + (hashSeed % 5) * 50_000m) : null;
                p.SalePrice = p.ListingType == ListingType.Sale
                    ? Math.Round((baseSaleUsd * 12600m) + (hashSeed % 7) * 2_000_000m) : null;
                p.PricePerNight = p.ListingType == ListingType.ShortTermRent
                    ? Math.Round((baseNightUsd * 12600m) + (hashSeed % 3) * 10_000m) : null;

                p.Price = p.SalePrice ?? p.MonthlyRent ?? p.PricePerNight ?? 0;
                p.SecurityDeposit = p.ListingType == ListingType.Rent ? p.MonthlyRent * 1.5m : null;
            }

            var bookings = await db.Bookings
                .Where(b => b.Property!.Description == "Yaxshi joylashuv")
                .ToListAsync();

            foreach (var b in bookings)
            {
                var prop = properties.FirstOrDefault(x => x.Id == b.PropertyId);
                if (prop is null) continue;

                decimal totalPrice = prop.ListingType switch
                {
                    ListingType.ShortTermRent => (prop.PricePerNight ?? 50m) * (b.CheckOutDate - b.CheckInDate).Days,
                    ListingType.Rent => prop.MonthlyRent ?? 500m,
                    _ => (prop.SalePrice ?? 60000m) * 0.02m
                };
                b.TotalPrice = Math.Round(totalPrice, 2);
            }

            await db.SaveChangesAsync();
            return Ok(new { message = "Prices updated successfully", count = properties.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Error fixing prices",
                error = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }
}
