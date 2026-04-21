using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Chat;
using Mulkchi.Api.Models.Foundations.Properties;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Services.Foundations.Chat;

public partial class ChatService : IChatService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;

    public ChatService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
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

        // Get or create session
        ChatSession session;
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

        // Detect intent
        var intent = await DetectIntentAsync(request.Message);

        // Save user message
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

        // Generate response based on intent
        AIChatResponse response;
        if (intent == "compare" && request.PropertyIds?.Count >= 2)
        {
            var comparison = await ComparePropertiesAsync(request.PropertyIds);
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

        // Save AI response
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

        // Update session title if first message
        if (session.Messages?.Count <= 1)
        {
            session.Title = request.Message.Length > 30
                ? request.Message.Substring(0, 30) + "..."
                : request.Message;
            await this.storageBroker.UpdateChatSessionAsync(session);
        }

        return response;
    }

    public async ValueTask<ComparisonResult> ComparePropertiesAsync(List<Guid> propertyIds)
    {
        var properties = await this.storageBroker.SelectAllProperties()
            .Where(p => propertyIds.Contains(p.Id) && p.Status == PropertyStatus.Active)
            .ToListAsync();

        if (properties.Count < 2)
            throw new ArgumentException("At least 2 properties are required for comparison.");

        var details = properties.Select(p => new PropertyComparisonDetail
        {
            PropertyId = p.Id,
            Title = p.Title,
            Price = p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight,
            Area = (int)p.Area,
            Bedrooms = p.NumberOfBedrooms,
            District = p.District ?? p.City ?? "Unknown",
            Pros = GetPropertyPros(p),
            Cons = GetPropertyCons(p),
            Score = CalculatePropertyScore(p)
        }).ToList();

        var summary = GenerateComparisonSummary(details);
        var recommendation = GenerateRecommendation(details);

        return new ComparisonResult
        {
            ComparedPropertyIds = propertyIds,
            Summary = summary,
            Details = details,
            Recommendation = recommendation
        };
    }

    public async ValueTask<string> GenerateComparisonSummaryAsync(List<Guid> propertyIds)
    {
        var result = await ComparePropertiesAsync(propertyIds);
        return result.Summary;
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

    private List<string> GetPropertyPros(Property p)
    {
        var pros = new List<string>();
        if (p.NumberOfBedrooms >= 3) pros.Add("Spacious - 3+ bedrooms");
        if (p.Area > 100) pros.Add("Large area");
        if (p.HasWifi) pros.Add("Has WiFi");
        if (p.HasParking) pros.Add("Parking available");
        if (p.HasPool) pros.Add("Swimming pool");
        if (p.HasAirConditioning) pros.Add("Air conditioning");
        if (p.HasElevator) pros.Add("Elevator available");
        if (p.HasFurniture) pros.Add("Furnished");
        return pros;
    }

    private List<string> GetPropertyCons(Property p)
    {
        var cons = new List<string>();
        if (p.NumberOfBedrooms <= 1) cons.Add("Small - 1 bedroom");
        if (p.Area < 50) cons.Add("Compact area");
        if (!p.HasWifi) cons.Add("No WiFi");
        if (!p.HasParking) cons.Add("No parking");
        if (!p.HasAirConditioning) cons.Add("No AC");
        return cons;
    }

    private int CalculatePropertyScore(Property p)
    {
        int score = 50; // Base score
        score += p.NumberOfBedrooms * 5;
        score += (int)(p.Area / 10);
        if (p.HasWifi) score += 10;
        if (p.HasParking) score += 10;
        if (p.HasPool) score += 15;
        if (p.HasAirConditioning) score += 10;
        if (p.HasElevator) score += 5;
        if (p.HasFurniture) score += 10;
        if (p.IsRenovated) score += 5;
        return score;
    }

    private string GenerateComparisonSummary(List<PropertyComparisonDetail> details)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"I've compared {details.Count} properties for you:");
        sb.AppendLine();

        var bestValue = details.OrderByDescending(d => d.Area / (d.Price ?? 1)).FirstOrDefault();
        var highestScore = details.OrderByDescending(d => d.Score).First();

        sb.AppendLine($"**Best Value**: {bestValue?.Title} (${bestValue?.Price:N0} for {bestValue?.Area}m²)");
        sb.AppendLine($"**Top Rated**: {highestScore.Title} (Score: {highestScore.Score}/100)");
        sb.AppendLine();

        foreach (var d in details)
        {
            sb.AppendLine($"• {d.Title} ({d.District}) - {d.Area}m², {d.Bedrooms}BR, ${d.Price:N0}");
        }

        return sb.ToString();
    }

    private string GenerateRecommendation(List<PropertyComparisonDetail> details)
    {
        var best = details.OrderByDescending(d => d.Score).First();
        return $"Based on the comparison, I recommend **{best.Title}** which offers the best overall value with a score of {best.Score}/100.";
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
            return $"I found {suggestions.Count} properties that match your query. Here are some suggestions:";
        }
        return "I couldn't find specific properties matching your query. Try asking for properties in a specific location or with certain features.";
    }

    private string GenerateGeneralResponse(string message)
    {
        var lowerMessage = message.ToLower();

        if (lowerMessage.Contains("salom") || lowerMessage.Contains("hello") || lowerMessage.Contains("hi"))
            return "Assalomu alaykum! Welcome to Mulkchi. I'm your AI assistant for finding properties. How can I help you today?";

        if (lowerMessage.Contains("rahmat") || lowerMessage.Contains("thank"))
            return "You're welcome! I'm here to help with any property-related questions.";

        if (lowerMessage.Contains("narx") || lowerMessage.Contains("price"))
            return "I can help you find properties in different price ranges. What's your budget?";

        if (lowerMessage.Contains("joylash") || lowerMessage.Contains("location") || lowerMessage.Contains("qayerda"))
            return "I can help you find properties in Tashkent, Samarkand, Bukhara, and other cities in Uzbekistan. Which area are you interested in?";

        return "I understand. I'm here to help you find the perfect property. You can ask me to:\n" +
               "• Search for properties by location, price, or features\n" +
               "• Compare multiple properties\n" +
               "• Get recommendations based on your needs\n\n" +
               "What would you like to know?";
    }
}
