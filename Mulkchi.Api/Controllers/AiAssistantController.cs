using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiAssistantController : ControllerBase
{
    [HttpPost("chat")]
    [Authorize]
    public ActionResult<object> ChatWithAi([FromBody] AiChatRequest request)
    {
        try
        {
            // Superior Modern AI logic mock: Parse natural language for intent, city, and dates.
            // If the user asks for "Chorvoqdan dacha topib ber"
            string responseText = "Sizning so'rovingizni tushundim. " +
                                  (request.IsVoice ? "Ovozli buyruq qabul qilindi. " : "") +
                                  "Chorvoq hududidan quyidagi dam olish maskanlarini taklif qilaman:";
            
            var mockProperties = new[]
            {
                new { Id = Guid.NewGuid(), Title = "Chorvoq manzarasiga ega lyuks dacha", Price = 150, Currency = "USD", ImageUrl = "https://picsum.photos/400/300" },
                new { Id = Guid.NewGuid(), Title = "Chorvoq sohilidagi qulay uy", Price = 120, Currency = "USD", ImageUrl = "https://picsum.photos/400/301" }
            };

            return Ok(new
            {
                botResponse = responseText,
                suggestedProperties = mockProperties,
                voiceCommandAcknowledged = request.IsVoice
            });
        }
        catch (Exception)
        {
            return StatusCode(500, "Xatolik yuz berdi");
        }
    }
}

public class AiChatRequest
{
    public string Message { get; set; }
    public bool IsVoice { get; set; }
}
