using Telegram.Bot;
using Telegram.Bot.Types.Enums;

namespace Mulkchi.Api.Brokers.Tokens;

public class TelegramBroker : ITelegramBroker
{
    private readonly TelegramBotClient? _botClient;
    private readonly ILogger<TelegramBroker> _logger;
    private readonly bool _isEnabled;

    public TelegramBroker(IConfiguration configuration, ILogger<TelegramBroker> logger)
    {
        _logger = logger;
        var token = configuration["TelegramAuth:BotToken"];

        if (string.IsNullOrWhiteSpace(token))
        {
            _isEnabled = false;
            _logger.LogWarning("Telegram bot token topilmadi. Telegram xabarlari yuborilmaydi.");
            return;
        }

        _botClient = new TelegramBotClient(token);
        _isEnabled = true;
    }

    public async Task SendMessageAsync(long chatId, string text)
    {
        if (!_isEnabled || _botClient is null)
        {
            _logger.LogInformation("Telegram xabari yuborilmadi: bot o'chirilgan. ChatId: {ChatId}", chatId);
            return;
        }

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