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
            return StatusCode(500, new { message = "Error during reset", error = ex.Message });
        }
    }
}
