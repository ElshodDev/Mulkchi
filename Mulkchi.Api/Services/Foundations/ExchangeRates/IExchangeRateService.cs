namespace Mulkchi.Api.Services.Foundations.ExchangeRates;

public interface IExchangeRateService
{
    ValueTask<decimal> GetCurrentUsdRateAsync();
}
