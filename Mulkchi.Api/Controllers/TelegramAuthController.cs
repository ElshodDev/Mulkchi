using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Auth;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/auth/telegram")]
public class TelegramAuthController : ControllerBase
{
    private readonly ITelegramAuthService _telegramAuthService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TelegramAuthController> _logger;

    public TelegramAuthController(
        ITelegramAuthService telegramAuthService,
        IConfiguration configuration,
        ILogger<TelegramAuthController> logger)
    {
        _telegramAuthService = telegramAuthService;
        _configuration = configuration;
        _logger = logger;
    }

    // ──────────────────────────────────────────────
    // POST /api/auth/telegram/init
    // Frontend bu endpoint ga murojaat qilib deep link oladi
    // ──────────────────────────────────────────────
    [HttpPost("init")]
    public async Task<ActionResult<TelegramInitResponse>> InitiateLogin()
    {
        try
        {
            var result = await _telegramAuthService.InitiateLoginAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram login init da xato");
            return StatusCode(500, new { message = "Telegram login boshlashda xato yuz berdi" });
        }
    }

    // ──────────────────────────────────────────────
    // GET /api/auth/telegram/status/{sessionId}
    // Frontend 2 soniyada bir bu endpoint polling qiladi
    // ──────────────────────────────────────────────
    [HttpGet("status/{sessionId}")]
    public async Task<ActionResult<TelegramSessionStatus>> CheckStatus(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length != 32)
            return BadRequest(new { message = "Noto'g'ri session ID" });

        try
        {
            var status = await _telegramAuthService.CheckSessionStatusAsync(sessionId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Session status tekshirishda xato. SessionId: {SessionId}", sessionId);
            return StatusCode(500, new { message = "Status tekshirishda xato" });
        }
    }

    // ──────────────────────────────────────────────
    // POST /api/auth/telegram/webhook
    // Telegram serverdan keladigan update (bot /start bosdi)
    // Bu URL ni Telegram ga ro'yxatdan o'tkazish kerak
    // ──────────────────────────────────────────────
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook(
        [FromBody] TelegramUpdate update,
        [FromHeader(Name = "X-Telegram-Bot-Api-Secret-Token")] string secretToken)
    {
        // Webhook xavfsizlik tekshiruvi
        var expectedToken = _configuration["TelegramAuth:WebhookSecretToken"];
        if (!string.IsNullOrEmpty(expectedToken) && secretToken != expectedToken)
        {
            _logger.LogWarning("Noto'g'ri webhook secret token");
            return Unauthorized();
        }

        try
        {
            await _telegramAuthService.HandleBotUpdateAsync(update);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Webhook xatosi. UpdateId: {UpdateId}", update?.UpdateId);
            // Telegram 200 javob kutadi, aks holda qayta yuboradi
            return Ok();
        }
    }
}