using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Compare;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.Compare;

public class CompareService : ICompareService
{
    private readonly IStorageBroker storageBroker;

    public CompareService(IStorageBroker storageBroker)
    {
        this.storageBroker = storageBroker;
    }

    public async ValueTask<ComparisonResult> ComparePropertiesAsync(List<Guid> propertyIds)
    {
        var properties = await this.storageBroker.SelectAllProperties()
            .Where(p => propertyIds.Contains(p.Id) && p.Status == PropertyStatus.Active)
            .ToListAsync();

        if (properties.Count < 2)
            throw new ArgumentException("Solishtirish uchun kamida 2 ta mulk kerak.");

        decimal avgPricePerSqm = 0;
        var validProperties = properties.Where(p => p.Area > 0 && (p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight).HasValue).ToList();

        if (validProperties.Any())
        {
            avgPricePerSqm = validProperties.Average(p => (p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight)!.Value / (decimal)p.Area);
        }

        var details = properties.Select(p =>
        {
            decimal price = p.MonthlyRent ?? p.SalePrice ?? p.PricePerNight ?? 0;
            decimal thisPricePerSqm = p.Area > 0 ? price / (decimal)p.Area : 0;

            return new PropertyComparisonDetail
            {
                PropertyId = p.Id,
                Title = p.Title,
                Price = price,
                Area = (int)p.Area,
                Bedrooms = p.NumberOfBedrooms,
                District = p.District ?? p.City ?? "Noma'lum",
                Pros = GetPropertyPros(p),
                Cons = GetPropertyCons(p),
                Score = CalculatePropertyScore(p),
                ValueRating = EvaluateValue(thisPricePerSqm, avgPricePerSqm)
            };
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

    private string EvaluateValue(decimal thisPricePerSqm, decimal avgPricePerSqm)
    {
        if (avgPricePerSqm == 0 || thisPricePerSqm == 0) return "O'rtacha";

        decimal ratio = thisPricePerSqm / avgPricePerSqm;
        if (ratio < 0.85m) return "Zo'r tanlov (Arzon)";
        if (ratio > 1.15m) return "Qimmatroq (Premium)";
        return "O'rtacha narx";
    }

    private List<string> GetPropertyPros(Property p)
    {
        var pros = new List<string>();
        if (p.NumberOfBedrooms >= 3) pros.Add("Keng - 3+ xona");
        if (p.Area >= 100) pros.Add("Katta maydon");
        if (p.HasWifi) pros.Add("Yuqori tezlikdagi WiFi");
        if (p.HasParking) pros.Add("Avtoturargoh");
        if (p.HasPool) pros.Add("Basseyn");
        if (p.HasAirConditioning) pros.Add("Konditsioner");
        if (p.HasElevator) pros.Add("Lift mavjud");
        if (p.HasFurniture) pros.Add("Jihozlangan");
        if (p.IsRenovated) pros.Add("Yevrota'mir");
        return pros;
    }

    private List<string> GetPropertyCons(Property p)
    {
        var cons = new List<string>();
        if (p.NumberOfBedrooms <= 1) cons.Add("Kichik - 1 xonali");
        if (p.Area < 50) cons.Add("Ixcham maydon");
        if (!p.HasWifi) cons.Add("WiFi yo'q");
        if (!p.HasParking) cons.Add("Turargoh yo'q");
        if (!p.HasAirConditioning) cons.Add("Konditsioner yo'q");
        return cons;
    }

    private int CalculatePropertyScore(Property p)
    {
        int score = 50;
        score += p.NumberOfBedrooms * 5;
        score += (int)(p.Area / 10);
        if (p.HasWifi) score += 5;
        if (p.HasParking) score += 10;
        if (p.HasPool) score += 10;
        if (p.HasAirConditioning) score += 5;
        if (p.HasElevator) score += 5;
        if (p.HasFurniture) score += 10;
        if (p.IsRenovated) score += 10;

        return Math.Min(score, 100);
    }

    private string GenerateComparisonSummary(List<PropertyComparisonDetail> details)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"Siz uchun {details.Count} ta mulkni solishtirdim:");
        sb.AppendLine();

        var bestValue = details.OrderByDescending(d => d.Area / (d.Price == 0 ? 1 : d.Price)).FirstOrDefault();
        var highestScore = details.OrderByDescending(d => d.Score).First();

        if (bestValue != null)
            sb.AppendLine($"**Eng manfaatli (Arzon va keng)**: {bestValue.Title} ({bestValue.Area}m² - {bestValue.Price:N0} so'm)");

        sb.AppendLine($"**Eng ko'p qulayliklarga ega**: {highestScore.Title} (Reyting: {highestScore.Score}/100)");
        sb.AppendLine();

        foreach (var d in details)
        {
            sb.AppendLine($"- {d.Title} ({d.District}) - {d.Area}m², {d.Bedrooms} xona, {d.Price:N0} so'm. Holati: {d.ValueRating}");
        }

        return sb.ToString();
    }

    private string GenerateRecommendation(List<PropertyComparisonDetail> details)
    {
        var best = details.OrderByDescending(d => d.Score).First();
        return $"Solishtirish natijalariga ko'ra, sizga **{best.Title}** ob'yektini tavsiya qilaman. U {best.Score}/100 ball bilan barcha qulayliklarga ega.";
    }
}
