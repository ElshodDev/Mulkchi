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

            // Delete all seeded demo properties (identified by demo description)
            var seededProperties = await db.SelectAllProperties()
                .Where(p => p.Description == "Yaxshi joylashuv")
                .ToListAsync();

            int deletedCount = seededProperties.Count;
            foreach (var property in seededProperties)
            {
                await db.DeletePropertyByIdAsync(property.Id);
            }

            // Also reset seeded users so they get re-created
            var seededUsers = await db.SelectAllUsers()
                .Where(u => u.Email != null && u.Email.EndsWith("@demo.mulkchi.uz"))
                .ToListAsync();

            foreach (var user in seededUsers)
            {
                await db.DeleteUserByIdAsync(user.Id);
            }

            // Re-seed everything fresh
            await DevelopmentDataSeeder.SeedProductionAsync(_serviceProvider);

            return Ok(new
            {
                message = "Reset and re-seeding completed successfully.",
                deletedProperties = deletedCount,
                deletedUsers = seededUsers.Count
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error during reset", error = ex.Message });
        }
    }
}
