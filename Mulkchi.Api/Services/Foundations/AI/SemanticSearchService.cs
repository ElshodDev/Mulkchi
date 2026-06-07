using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.AI
{
    public class SemanticSearchService : ISemanticSearchService
    {
        public ValueTask<PropertySearchParams> ParseQueryAsync(string rawQuery)
        {
            if (string.IsNullOrWhiteSpace(rawQuery))
            {
                return new ValueTask<PropertySearchParams>(new PropertySearchParams());
            }

            var query = rawQuery.ToLowerInvariant();
            var searchParams = new PropertySearchParams();

            // Extract Rooms
            var roomMatch = Regex.Match(query, @"(\d+)\s*(?:xona|xonali|x)");
            if (roomMatch.Success && int.TryParse(roomMatch.Groups[1].Value, out int rooms))
            {
                searchParams.Bedrooms = rooms;
            }

            // Extract Price
            // Examples: "500 dollargacha", "1000 $", "30000 yevro", "400 dan 800 gacha"
            var priceGachaMatch = Regex.Match(query, @"(\d+)\s*(?:ming|m|k)?\s*(?:\$|dollar|usd|sum|so'm).*(?:gacha|gacha bo'lgan|atrofida)");
            if (priceGachaMatch.Success && int.TryParse(priceGachaMatch.Groups[1].Value, out int maxPrice))
            {
                searchParams.MaxPrice = AdjustPriceWithMultiplier(priceGachaMatch.Groups[1].Value, query);
            }
            else
            {
                var justPriceMatch = Regex.Match(query, @"(\d+)\s*(?:\$|dollar|usd)");
                if (justPriceMatch.Success && int.TryParse(justPriceMatch.Groups[1].Value, out int price))
                {
                    searchParams.MaxPrice = AdjustPriceWithMultiplier(justPriceMatch.Groups[1].Value, query);
                }
            }

            // Extract Listing Type (Rent vs Sale)
            if (Regex.IsMatch(query, @"ijara|rent|ijaraga|kvartira"))
            {
                searchParams.ListingType = ListingType.Rent;
            }
            else if (Regex.IsMatch(query, @"sotib|sotiladigan|sotuv|sale|buy"))
            {
                searchParams.ListingType = ListingType.Sale;
            }

            // Extract Property Type
            if (Regex.IsMatch(query, @"hovli|dom|hovlili|uchastka"))
            {
                searchParams.PropertyType = PropertyType.House;
            }
            else if (Regex.IsMatch(query, @"kvartira|kv|ko'p qavatli"))
            {
                searchParams.PropertyType = PropertyType.Apartment;
            }
            else if (Regex.IsMatch(query, @"ofis|biznes|do'kon|noturar"))
            {
                searchParams.PropertyType = PropertyType.Commercial;
            }

            // Whatever is left can be used as the search term or location
            string locationQuery = Regex.Replace(query, @"(\d+)\s*(?:xona|xonali|x)", "");
            locationQuery = Regex.Replace(locationQuery, @"(\d+)\s*(?:ming|m|k)?\s*(?:\$|dollar|usd|sum|so'm).*(?:gacha|gacha bo'lgan|atrofida)?", "");
            locationQuery = Regex.Replace(locationQuery, @"ijara|rent|ijaraga|sotib|sotiladigan|sotuv|sale|buy|kvartira|hovli|dom|hovlili|uchastka|ofis|biznes|do'kon|noturar|uy|uylar", "");
            locationQuery = Regex.Replace(locationQuery, @"(?:dan|gacha|atrofida|qidir|izla|topib ber|kerak|arzon|qimmat|yaxshi)", "");
            
            searchParams.SearchQuery = locationQuery.Trim();
            if (string.IsNullOrWhiteSpace(searchParams.SearchQuery))
            {
                searchParams.SearchQuery = null;
            }

            return new ValueTask<PropertySearchParams>(searchParams);
        }

        private decimal AdjustPriceWithMultiplier(string priceStr, string query)
        {
            if (decimal.TryParse(priceStr, out decimal price))
            {
                if (Regex.IsMatch(query, @"ming\s*(?:\$|dollar|usd)") || Regex.IsMatch(query, @"k\s*(?:\$|dollar|usd)"))
                {
                    return price * 1000m;
                }
                return price;
            }
            return 0;
        }
    }
}
