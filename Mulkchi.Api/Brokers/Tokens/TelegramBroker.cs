using Telegram.Bot;
using Telegram.Bot.Types.Enums;

namespace Mulkchi.Api.Brokers.Tokens;

public class TelegramBroker : ITelegramBroker
{
    private readonly TelegramBotClient _botClient;
    private readonly ILogger<TelegramBroker> _logger;

    public TelegramBroker(IConfiguration configuration, ILogger<TelegramBroker> logger)
    {
        _logger = logger;
        var token = configuration["TelegramAuth:BotToken"]
            ?? throw new InvalidOperationException("TelegramAuth:BotToken sozlanmagan");

        _botClient = new TelegramBotClient(token);
    }

    public async Task SendMessageAsync(long chatId, string text)
    {
        try
        {
            await _botClient.SendMessage(
                chatId: chatId,
                text: text,
                parseMode: ParseMode.Html
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram xabar yuborishda xato. ChatId: {ChatId}", chatId);
            throw;
        }
    }

    public async Task SendOtpCodeAsync(long chatId, string code, string appName = "Mulkchi")
    {
        var message = $"""
            <b>{appName}</b> — Tasdiqlash kodi

            Sizning kodingiz: <code>{code}</code>

            Ushbu kod <b>5 daqiqa</b> ichida amal qiladi.
            Kodni hech kimga bermang!
            """;

        await SendMessageAsync(chatId, message);
    }
}