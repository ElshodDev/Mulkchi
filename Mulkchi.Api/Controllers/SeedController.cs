using Microsoft.AspNetCore.Mvc;
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
}
