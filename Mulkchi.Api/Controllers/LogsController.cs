using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class LogsController : ControllerBase
{
    private readonly ILogger<LogsController> _logger;
    private readonly string _logsPath;

    public LogsController(ILogger<LogsController> logger)
    {
        _logger = logger;
        _logsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logs");
    }

    [HttpGet]
    public ActionResult GetLogs([FromQuery] int count = 100)
    {
        try
        {
            if (!Directory.Exists(_logsPath))
            {
                return NotFound(new { message = "Logs directory not found." });
            }

            var logFile = Directory.GetFiles(_logsPath, "mulkchi-*.txt")
                .OrderByDescending(f => f)
                .FirstOrDefault();

            if (logFile == null)
            {
                return NotFound(new { message = "No log files found." });
            }

            var lines = System.IO.File.ReadLines(logFile)
                .Reverse()
                .Take(count)
                .ToList();

            return Ok(new
            {
                fileName = Path.GetFileName(logFile),
                lastUpdated = System.IO.File.GetLastWriteTime(logFile),
                logs = lines
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving logs");
            return StatusCode(500, new { message = "Error retrieving logs" });
        }
    }

    [HttpGet("stats")]
    public ActionResult GetLogStats()
    {
        try
        {
            if (!Directory.Exists(_logsPath))
            {
                return Ok(new { errorCount = 0, warningCount = 0, infoCount = 0 });
            }

            var logFile = Directory.GetFiles(_logsPath, "mulkchi-*.txt")
                .OrderByDescending(f => f)
                .FirstOrDefault();

            if (logFile == null)
            {
                return Ok(new { errorCount = 0, warningCount = 0, infoCount = 0 });
            }

            var content = System.IO.File.ReadAllText(logFile);
            
            return Ok(new
            {
                errorCount = content.Split(" ERR ").Length - 1,
                warningCount = content.Split(" WRN ").Length - 1,
                infoCount = content.Split(" INF ").Length - 1,
                fileSize = new FileInfo(logFile).Length / 1024.0 / 1024.0 // MB
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving log stats");
            return StatusCode(500, new { message = "Error retrieving log stats" });
        }
    }
}
