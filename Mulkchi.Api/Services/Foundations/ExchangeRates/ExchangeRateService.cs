using System.Text.Json;

namespace Mulkchi.Api.Services.Foundations.ExchangeRates;

public class ExchangeRateService : IExchangeRateService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExchangeRateService> _logger;
    private static decimal _cachedRate = 12600m;
    private static DateTime _lastFetched = DateTime.MinValue;
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public ExchangeRateService(IHttpClientFactory httpClientFactory, ILogger<ExchangeRateService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async ValueTask<decimal> GetCurrentUsdRateAsync()
    {
        // Keshni tekshirish (Har 6 soatda bir marta yangilanadi)
        if ((DateTime.UtcNow - _lastFetched).TotalHours < 6)
        {
            return _cachedRate;
        }

        await _semaphore.WaitAsync();
        try
        {
            if ((DateTime.UtcNow - _lastFetched).TotalHours < 6)
                return _cachedRate;

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                using var document = JsonDocument.Parse(content);
                
                foreach (var element in document.RootElement.EnumerateArray())
                {
                    if (element.GetProperty("Ccy").GetString() == "USD")
                    {
                        var rateStr = element.GetProperty("Rate").GetString();
                        if (decimal.TryParse(rateStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal rate))
                        {
                            _cachedRate = rate;
                            _lastFetched = DateTime.UtcNow;
                            _logger.LogInformation("Markaziy Bankdan yangi kurs olindi: 1 USD = {Rate} UZS", _cachedRate);
                            return _cachedRate;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Markaziy Bank API si bilan ulanishda xatolik yuz berdi. Eski kursdan foydalanilmoqda: {Rate}", _cachedRate);
        }
        finally
        {
            _semaphore.Release();
        }

        return _cachedRate;
    }
}
