using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/logs")]
public class LogsController : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public ActionResult<object> GetLogs([FromQuery] int count = 100)
    {
        var items = new List<string>();
        return Ok(new { items, total = 0, requested = count });
    }
}
