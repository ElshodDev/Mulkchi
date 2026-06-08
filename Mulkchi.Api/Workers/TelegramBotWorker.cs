using Mulkchi.Api.Models.Foundations.Auth;
using Mulkchi.Api.Services.Foundations.Auth;
using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;

namespace Mulkchi.Api.Workers;

public class TelegramBotWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TelegramBotWorker> _logger;

    public TelegramBotWorker(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<TelegramBotWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var token = _configuration["TelegramAuth:BotToken"];
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("TelegramBotWorker: BotToken topilmadi, background polling to'xtatildi.");
            return;
        }

        var botClient = new TelegramBotClient(token);

        var receiverOptions = new ReceiverOptions
        {
            AllowedUpdates = new[] { Telegram.Bot.Types.Enums.UpdateType.Message }
        };

        botClient.StartReceiving(
            updateHandler: HandleUpdateAsync,
            errorHandler: HandleErrorAsync,
            receiverOptions: receiverOptions,
            cancellationToken: stoppingToken
        );

        _logger.LogInformation("TelegramBotWorker: Lokal polling boshlandi (Webhook o'rniga).");

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
    {
        if (update.Type != Telegram.Bot.Types.Enums.UpdateType.Message || update.Message == null)
            return;

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var telegramAuthService = scope.ServiceProvider.GetRequiredService<ITelegramAuthService>();

            var customUpdate = new TelegramUpdate
            {
                UpdateId = update.Id,
                Message = new TelegramMessage
                {
                    MessageId = update.Message.MessageId,
                    Chat = new TelegramChat { Id = update.Message.Chat.Id },
                    Text = update.Message.Text ?? string.Empty,
                    Date = update.Message.Date,
                    From = update.Message.From == null ? new TelegramUser { FirstName = string.Empty, LastName = string.Empty, Username = string.Empty } : new TelegramUser
                    {
                        Id = update.Message.From.Id,
                        FirstName = update.Message.From.FirstName,
                        LastName = update.Message.From.LastName ?? string.Empty,
                        Username = update.Message.From.Username ?? string.Empty
                    }
                }
            };

            await telegramAuthService.HandleBotUpdateAsync(customUpdate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram xabarni qayta ishlashda xatolik yuz berdi.");
        }
    }

    private Task HandleErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Telegram Polling xatosi");
        return Task.CompletedTask;
    }
}
