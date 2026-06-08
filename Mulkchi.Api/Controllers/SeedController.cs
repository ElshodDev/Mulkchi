using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.DataSeed;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;

    public SeedController(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

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

    [HttpPost("reset")]
    public async Task<IActionResult> ResetAndReseed()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IStorageBroker>();

            var dbContext = scope.ServiceProvider.GetRequiredService<StorageBroker>();

            // Delete Bookings, Reviews, Favorites, Discounts related to demo properties
            await dbContext.Bookings.Where(b => b.Property.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.Reviews.Where(r => r.Property.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.Favorites.Where(f => f.Property.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.Discounts.Where(d => d.Code.StartsWith("DEMO")).ExecuteDeleteAsync();

            // Delete child entities of properties
            await dbContext.PropertyImages.Where(pi => pi.Property.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.PropertyAmenities.Where(pa => pa.Property.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();
            await dbContext.PropertyViews.Where(pv => pv.Property.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();

            // Now delete properties
            int deletedProperties = await dbContext.Properties.Where(p => p.Description == "Yaxshi joylashuv").ExecuteDeleteAsync();

            // Delete Bookings and Reviews related to demo users
            await dbContext.Bookings.Where(b => b.Guest.Email != null && b.Guest.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();
            await dbContext.Reviews.Where(r => r.Reviewer.Email != null && r.Reviewer.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();

            // Delete user subscriptions before users
            await dbContext.UserSubscriptions.Where(s => s.User.Email != null && s.User.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();

            // Now delete users
            int deletedUsers = await dbContext.Users.Where(u => u.Email != null && u.Email.EndsWith("@demo.mulkchi.uz")).ExecuteDeleteAsync();

            // Re-seed everything fresh
            await DevelopmentDataSeeder.SeedProductionAsync(_serviceProvider);

            return Ok(new
            {
                message = "Reset and re-seeding completed successfully.",
                deletedProperties = deletedProperties,
                deletedUsers = deletedUsers
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

    [HttpPost("fix-prices")]
    public async Task<IActionResult> FixPrices()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<StorageBroker>();
            
            var properties = await db.Properties.Where(p => p.Description == "Yaxshi joylashuv").ToListAsync();
            
            foreach (var p in properties)
            {
                int beds = p.NumberOfBedrooms;
                decimal baseRentUsd = beds == 1 ? 250 : beds == 2 ? 350 : 450;
                decimal baseSaleUsd = beds == 1 ? 35000 : beds == 2 ? 50000 : 70000;
                decimal baseNightUsd = beds == 1 ? 25 : beds == 2 ? 35 : 50;

                if (p.District == "Mirobod" || p.District == "Yakkasaroy" || p.District == "Mirzo Ulug'bek" || p.District == "Shayxontohur")
                {
                    baseRentUsd *= 1.3m; baseSaleUsd *= 1.3m; baseNightUsd *= 1.3m;
                }
                else if (p.District == "Sergeli" || p.District == "Uchtepa")
                {
                    baseRentUsd *= 0.9m; baseSaleUsd *= 0.9m; baseNightUsd *= 0.9m;
                }

                if (p.BuildingType == Mulkchi.Api.Models.Foundations.Properties.BuildingType.NewBuilding)
                {
                    baseRentUsd *= 1.2m; baseSaleUsd *= 1.2m; baseNightUsd *= 1.2m;
                }

                if (p.District == "Olmazor" && beds >= 3 && p.BuildingType == Mulkchi.Api.Models.Foundations.Properties.BuildingType.OldBuilding)
                {
                    baseRentUsd = 350m;
                }
                if (p.District == "Sergeli" && beds == 2 && p.BuildingType == Mulkchi.Api.Models.Foundations.Properties.BuildingType.NewBuilding)
                {
                    baseRentUsd = 380m;
                }

                int i = Math.Abs(p.Id.GetHashCode());

                p.MonthlyRent = p.ListingType == Mulkchi.Api.Models.Foundations.Properties.ListingType.Rent
                    ? Math.Round((baseRentUsd * 12600m) + (i % 5) * 50_000m) : null;
                p.SalePrice = p.ListingType == Mulkchi.Api.Models.Foundations.Properties.ListingType.Sale
                    ? Math.Round((baseSaleUsd * 12600m) + (i % 7) * 2_000_000m) : null;
                p.PricePerNight = p.ListingType == Mulkchi.Api.Models.Foundations.Properties.ListingType.ShortTermRent
                    ? Math.Round((baseNightUsd * 12600m) + (i % 3) * 10_000m) : null;

                p.Price = p.SalePrice ?? p.MonthlyRent ?? p.PricePerNight ?? 0;
                p.SecurityDeposit = p.ListingType == Mulkchi.Api.Models.Foundations.Properties.ListingType.Rent ? p.MonthlyRent * 1.5m : null;
            }

            var bookings = await db.Bookings.Where(b => b.Property.Description == "Yaxshi joylashuv").ToListAsync();
            foreach (var b in bookings)
            {
                var p = properties.FirstOrDefault(prop => prop.Id == b.PropertyId);
                if (p != null)
                {
                    decimal totalPrice = p.ListingType switch
                    {
                        Mulkchi.Api.Models.Foundations.Properties.ListingType.ShortTermRent => (p.PricePerNight ?? 50m) * (b.CheckOutDate - b.CheckInDate).Days,
                        Mulkchi.Api.Models.Foundations.Properties.ListingType.Rent => p.MonthlyRent ?? 500m,
                        _ => (p.SalePrice ?? 60000m) * 0.02m
                    };
                    b.TotalPrice = Math.Round(totalPrice, 2);
                }
            }

            await db.SaveChangesAsync();
            return Ok(new { message = "Prices updated successfully", count = properties.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fixing prices", error = ex.Message, inner = ex.InnerException?.Message });
        }
    }
}
