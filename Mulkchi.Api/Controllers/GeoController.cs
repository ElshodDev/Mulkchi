using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Geo;
using Mulkchi.Api.Services.Foundations.Geo;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GeoController : ControllerBase
{
    private readonly IGeoService geoService;

    public GeoController(IGeoService geoService)
    {
        this.geoService = geoService;
    }

    [HttpGet("nearby-properties")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyMapDto>>> GetNearbyProperties(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radius = 5)
    {
        try
        {
            if (lat == 0 || lng == 0)
                return BadRequest(new { message = "Latitude and longitude are required." });

            if (radius is < 0.1 or > 50)
                return BadRequest(new { message = "Radius must be between 0.1 and 50 km." });

            var properties = await this.geoService.GetPropertiesByLocationAsync(lat, lng, radius);
            return Ok(properties);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("nearby-places")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<NearbyPlaceDto>>> GetNearbyPlaces(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] string type = "supermarket",
        [FromQuery] double radius = 5)
    {
        try
        {
            if (lat == 0 || lng == 0)
                return BadRequest(new { message = "Latitude and longitude are required." });

            var validTypes = new[] { "metro", "park", "school", "supermarket", "restaurant", "hospital", "pharmacy", "bank" };
            if (!validTypes.Contains(type.ToLower()))
                return BadRequest(new { message = $"Invalid type. Valid types: {string.Join(", ", validTypes)}" });

            var places = await this.geoService.GetNearbyPlacesAsync(lat, lng, type, radius);
            return Ok(places);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("properties-map")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PropertyMapDto>>> GetPropertiesForMap()
    {
        try
        {
            var properties = await this.geoService.GetAllPropertiesForMapAsync();
            return Ok(properties);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("distance")]
    [AllowAnonymous]
    public ActionResult<DistanceResponseDto> CalculateDistance([FromBody] DistanceRequestDto request)
    {
        try
        {
            var distanceKm = this.geoService.CalculateDistance(request.Lat1, request.Lng1, request.Lat2, request.Lng2);

            return Ok(new DistanceResponseDto
            {
                DistanceKm = Math.Round(distanceKm, 2),
                DistanceMeters = Math.Round(distanceKm * 1000, 0),
                Lat1 = request.Lat1,
                Lng1 = request.Lng1,
                Lat2 = request.Lat2,
                Lng2 = request.Lng2
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("districts")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<object>> GetUzbekistanDistricts()
    {
        try
        {
            var districts = GetUzbekistanDistrictsList();
            return Ok(districts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private static IEnumerable<object> GetUzbekistanDistrictsList()
    {
        return new List<object>
        {
            new { name = "Yashnobod", nameUz = "Yashnobod", nameRu = "Яшнабад", region = "Tashkent", lat = 41.2925, lng = 69.3417 },
            new { name = "Mirzo-Ulugbek", nameUz = "Mirzo-Ulug'bek", nameRu = "Мирзо-Улугбек", region = "Tashkent", lat = 41.3333, lng = 69.3333 },
            new { name = "Yunusabad", nameUz = "Yunusobod", nameRu = "Юнусабад", region = "Tashkent", lat = 41.3667, lng = 69.2833 },
            new { name = "Shaykhontohur", nameUz = "Shayxontohur", nameRu = "Шайхантахур", region = "Tashkent", lat = 41.3333, lng = 69.2167 },
            new { name = "Chilanzar", nameUz = "Chilonzor", nameRu = "Чиланзар", region = "Tashkent", lat = 41.2833, lng = 69.2167 },
            new { name = "Sergeli", nameUz = "Sergeli", nameRu = "Сергели", region = "Tashkent", lat = 41.2167, lng = 69.2167 },
            new { name = "Bektemir", nameUz = "Bektemir", nameRu = "Бектемир", region = "Tashkent", lat = 41.2167, lng = 69.2833 },
            new { name = "Uchtepa", nameUz = "Uchtepa", nameRu = "Учтепа", region = "Tashkent", lat = 41.2833, lng = 69.1667 },
            new { name = "Olmazar", nameUz = "Olmazor", nameRu = "Алмазар", region = "Tashkent", lat = 41.3667, lng = 69.1667 },
            new { name = "Mirobod", nameUz = "Mirobod", nameRu = "Мирабад", region = "Tashkent", lat = 41.3000, lng = 69.2833 },
            new { name = "Yakkasaray", nameUz = "Yakkasaroy", nameRu = "Яккасарай", region = "Tashkent", lat = 41.2833, lng = 69.2500 },
            new { name = "Khamza", nameUz = "Hamza", nameRu = "Хамза", region = "Tashkent", lat = 41.2500, lng = 69.3000 },

            // Samarkand districts
            new { name = "Registan", nameUz = "Registon", nameRu = "Регистан", region = "Samarkand", lat = 39.6542, lng = 66.9597 },
            new { name = "Khatunki", nameUz = "Xatunki", nameRu = "Хатунки", region = "Samarkand", lat = 39.6833, lng = 66.9833 },

            // Bukhara districts
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Bukhara", lat = 39.7686, lng = 64.4556 },

            // Andijan districts
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Andijan", lat = 40.7833, lng = 72.3500 },

            // Fergana districts
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Fergana", lat = 40.3894, lng = 71.7864 },

            // Namangan districts
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Namangan", lat = 40.9983, lng = 71.6726 },

            // Kokand (Fergana region)
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Kokand", lat = 40.5286, lng = 70.9425 },

            // Nukus (Karakalpakstan)
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Nukus", lat = 42.4531, lng = 59.6103 },

            // Khiva (Khorezm)
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Khiva", lat = 41.3783, lng = 60.3639 },

            // Termez (Surkhandarya)
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Termez", lat = 37.2242, lng = 67.2783 },

            // Jizzakh
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Jizzakh", lat = 40.1158, lng = 67.8422 },

            // Navoi
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Navoi", lat = 40.1031, lng = 65.3689 },

            // Karshi (Kashkadarya)
            new { name = "City Center", nameUz = "Shahar markazi", nameRu = "Центр города", region = "Karshi", lat = 38.8606, lng = 65.7897 }
        };
    }
}
