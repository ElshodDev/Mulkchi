using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Chat;
using Mulkchi.Api.Models.Foundations.Compare;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Services.Foundations.Compare;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Services.Foundations.Chat;

public partial class ChatService : IChatService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly ICompareService compareService;

    public ChatService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        ICompareService compareService)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.compareService = compareService;
    }

    public async ValueTask<ChatSession> StartSessionAsync(Guid? userId)
    {
        var session = new ChatSession
        {
            Id = GenerateSessionId(),
            UserId = userId,
            Title = "New Chat",
            CreatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset(),
            IsActive = true,
            Messages = new List<ChatMessage>()
        };

        await this.storageBroker.InsertChatSessionAsync(session);
        return session;
    }

    public async ValueTask EndSessionAsync(string sessionId)
    {
        var session = await this.storageBroker.SelectChatSessionByIdAsync(sessionId);
        if (session != null)
        {
            session.IsActive = false;
            session.EndedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            await this.storageBroker.UpdateChatSessionAsync(session);
        }
    }

    public async ValueTask<IEnumerable<ChatSession>> GetUserSessionsAsync(Guid userId)
    {
        return await this.storageBroker.SelectAllChatSessions()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedDate)
            .ToListAsync();
    }

    public async ValueTask<IEnumerable<ChatMessage>> GetSessionMessagesAsync(string sessionId)
    {
        return await this.storageBroker.SelectAllChatMessages()
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.CreatedDate)
            .ToListAsync();
    }

    public async ValueTask<AIChatResponse> ProcessMessageAsync(AIChatRequest request, Guid? userId)
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();

        ChatSession? session;
        if (!string.IsNullOrEmpty(request.SessionId))
        {
            session = await this.storageBroker.SelectChatSessionByIdAsync(request.SessionId);
        }
        else
        {
            session = await StartSessionAsync(userId);
        }

        if (session == null)
        {
            session = await StartSessionAsync(userId);
        }

        var intent = await DetectIntentAsync(request.Message);

        var userMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            SenderType = "user",
            Content = request.Message,
            CreatedDate = now,
            Intent = intent,
            RelatedPropertyIds = request.PropertyIds
        };
        await this.storageBroker.InsertChatMessageAsync(userMessage);

        AIChatResponse response;
        if (intent == "compare" && request.PropertyIds?.Count >= 2)
        {
            var comparison = await this.compareService.ComparePropertiesAsync(request.PropertyIds);
            response = new AIChatResponse
            {
                Message = comparison.Summary,
                SessionId = session.Id,
                Timestamp = now,
                Comparison = comparison
            };
        }
        else if (intent == "search" || request.PropertyIds?.Any() == true)
        {
            var suggestions = await GetPropertySuggestionsAsync(request.Message, request.PropertyIds);
            response = new AIChatResponse
            {
                Message = GenerateSearchResponse(request.Message, suggestions),
                SessionId = session.Id,
                Timestamp = now,
                SuggestedProperties = suggestions
            };
        }
        else
        {
            response = new AIChatResponse
            {
                Message = GenerateGeneralResponse(request.Message),
                SessionId = session.Id,
                Timestamp = now
            };
        }

        var aiMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            SenderType = "ai",
            Content = response.Message,
            CreatedDate = now,
            Intent = intent,
            RelatedPropertyIds = response.SuggestedProperties?.Select(s => s.Id).ToList()
        };
        await this.storageBroker.InsertChatMessageAsync(aiMessage);

        if (session.Messages?.Count <= 1)
        {
            session.Title = request.Message.Length > 30
                ? request.Message.Substring(0, 30) + "..."
                : request.Message;
            await this.storageBroker.UpdateChatSessionAsync(session);
        }

        return response;
    }

    public ValueTask<string> DetectIntentAsync(string message)
    {
        var lowerMessage = message.ToLower();

        if (lowerMessage.Contains("taqqos") ||
            lowerMessage.Contains("solish") ||
            lowerMessage.Contains("compare") ||
            lowerMessage.Contains("farq") ||
            lowerMessage.Contains("qaysi yaxshi") ||
            lowerMessage.Contains("qaysi biri"))
            return ValueTask.FromResult("compare");

        if (lowerMessage.Contains("qid") ||
            lowerMessage.Contains("top") ||
            lowerMessage.Contains("izla") ||
            lowerMessage.Contains("search") ||
            lowerMessage.Contains("toping") ||
            lowerMessage.Contains("kerak"))
            return ValueTask.FromResult("search");

        if (lowerMessage.Contains("narh") ||
            lowerMessage.Contains("narx") ||
            lowerMessage.Contains("bahosi") ||
            lowerMessage.Contains("qiymat") ||
            lowerMessage.Contains("price") ||
            lowerMessage.Contains("arzon"))
            return ValueTask.FromResult("price");

        return ValueTask.FromResult("general");
    }

    private static string GenerateSessionId()
    {
        return $"chat_{DateTimeOffset.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString()[..8]}";
    }

    private async Task<List<PropertySuggestion>> GetPropertySuggestionsAsync(string message, List<Guid>? propertyIds)
    {
        if (propertyIds?.Any() == true)
        {
            var properties = await this.storageBroker.SelectAllProperties()
                .Where(p => propertyIds.Contains(p.Id))
                .Take(5)
                .ToListAsync();

            return properties.Select(p => new PropertySuggestion
            {
                Id = p.Id,
                Title = p.Title,
                Reason = "Matches your query"
            }).ToList();
        }

        return new List<PropertySuggestion>();
    }

    private string GenerateSearchResponse(string message, List<PropertySuggestion> suggestions)
    {
        if (suggestions.Any())
        {
            return $"Sizning so'rovingizga mos keladigan {suggestions.Count} ta mulk topildi. Ba'zi takliflar:";
        }
        return "Afsuski, so'rovingizga mos keladigan mulk topilmadi. Qidiruvni o'zgartirib ko'ring.";
    }

    private string GenerateGeneralResponse(string message)
    {
        var lowerMessage = message.ToLower();

        if (lowerMessage.Contains("salom") || lowerMessage.Contains("hello") || lowerMessage.Contains("hi"))
            return "Assalomu alaykum! Mulkchiga xush kelibsiz. Men sizga kerakli uyni topishga yordam beradigan AI yordamchiman.";

        if (lowerMessage.Contains("rahmat") || lowerMessage.Contains("thank"))
            return "Arzimaydi! Yana qanday yordam bera olaman?";

        if (lowerMessage.Contains("narx") || lowerMessage.Contains("price"))
            return "Qanday byudjet rejalashtirgansiz? Menga taxminiy narxni aytsangiz, o'sha narxdagi uylarni ko'rsataman.";

        if (lowerMessage.Contains("joylash") || lowerMessage.Contains("location") || lowerMessage.Contains("qayerda"))
            return "Mulk qaysi shaharda yoki tumanda joylashgan bo'lishini xohlaysiz?";

        return "Tushundim. Siz quyidagilarni so'rashingiz mumkin:\n" +
               "• Uylarni narxi yoki joylashuvi bo'yicha qidirish\n" +
               "• Uylarni taqqoslash (solishtirish)\n" +
               "• Tavsiyalar olish\n\n" +
               "Sizni nima qiziqtiradi?";
    }
}
