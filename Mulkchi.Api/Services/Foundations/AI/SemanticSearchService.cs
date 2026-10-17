using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Services.Foundations.AI
{
    public class SemanticSearchService : ISemanticSearchService
    {
        // Uzbek & Russian district mappings for Tashkent and major regions
        private static readonly Dictionary<string, (string DistrictName, UzbekistanRegion Region)> DistrictMappings =
            new(StringComparer.OrdinalIgnoreCase)
            {
                { "chilonzor", ("Chilonzor", UzbekistanRegion.ToshkentShahar) },
                { "chilonzorda", ("Chilonzor", UzbekistanRegion.ToshkentShahar) },
                { "chilonzordagi", ("Chilonzor", UzbekistanRegion.ToshkentShahar) },
                { "chilonzordan", ("Chilonzor", UzbekistanRegion.ToshkentShahar) },
                { "yunusobod", ("Yunusobod", UzbekistanRegion.ToshkentShahar) },
                { "yunusoboda", ("Yunusobod", UzbekistanRegion.ToshkentShahar) },
                { "yunusoboddagi", ("Yunusobod", UzbekistanRegion.ToshkentShahar) },
                { "yunusoboddan", ("Yunusobod", UzbekistanRegion.ToshkentShahar) },
                { "mirobod", ("Mirobod", UzbekistanRegion.ToshkentShahar) },
                { "mirobodda", ("Mirobod", UzbekistanRegion.ToshkentShahar) },
                { "miroboddagi", ("Mirobod", UzbekistanRegion.ToshkentShahar) },
                { "mirzo ulug'bek", ("Mirzo Ulug'bek", UzbekistanRegion.ToshkentShahar) },
                { "mirzo ulugbek", ("Mirzo Ulug'bek", UzbekistanRegion.ToshkentShahar) },
                { "yakkasaroy", ("Yakkasaroy", UzbekistanRegion.ToshkentShahar) },
                { "yashnobod", ("Yashnobod", UzbekistanRegion.ToshkentShahar) },
                { "olmazor", ("Olmazor", UzbekistanRegion.ToshkentShahar) },
                { "shayxontohur", ("Shayxontohur", UzbekistanRegion.ToshkentShahar) },
                { "uchtepa", ("Uchtepa", UzbekistanRegion.ToshkentShahar) },
                { "sergeli", ("Sergeli", UzbekistanRegion.ToshkentShahar) },
                { "bektemir", ("Bektemir", UzbekistanRegion.ToshkentShahar) },
                { "yangihayot", ("Yangihayot", UzbekistanRegion.ToshkentShahar) }
            };

        private static readonly Dictionary<string, UzbekistanRegion> RegionMappings =
            new(StringComparer.OrdinalIgnoreCase)
            {
                { "toshkent", UzbekistanRegion.ToshkentShahar },
                { "tashkent", UzbekistanRegion.ToshkentShahar },
                { "samarqand", UzbekistanRegion.Samarqand },
                { "samarkand", UzbekistanRegion.Samarqand },
                { "buxoro", UzbekistanRegion.Buxoro },
                { "bukhara", UzbekistanRegion.Buxoro },
                { "andijon", UzbekistanRegion.Andijon },
                { "andijan", UzbekistanRegion.Andijon },
                { "farg'ona", UzbekistanRegion.Fargona },
                { "fargona", UzbekistanRegion.Fargona },
                { "fergana", UzbekistanRegion.Fargona },
                { "namangan", UzbekistanRegion.Namangan },
                { "qashqadaryo", UzbekistanRegion.Qashqadaryo },
                { "qarshi", UzbekistanRegion.Qashqadaryo },
                { "surxondaryo", UzbekistanRegion.Surxondaryo },
                { "termiz", UzbekistanRegion.Surxondaryo },
                { "xorazm", UzbekistanRegion.Xorazm },
                { "urganch", UzbekistanRegion.Xorazm },
                { "navoiy", UzbekistanRegion.Navoiy },
                { "navoi", UzbekistanRegion.Navoiy },
                { "jizzax", UzbekistanRegion.Jizzax },
                { "sirdaryo", UzbekistanRegion.Sirdaryo },
                { "guliston", UzbekistanRegion.Sirdaryo },
                { "qoraqalpog'iston", UzbekistanRegion.Qoraqalpogiston },
                { "nukus", UzbekistanRegion.Qoraqalpogiston }
            };

        private static readonly Dictionary<string, int> WordToRooms =
            new(StringComparer.OrdinalIgnoreCase)
            {
                { "bir", 1 },
                { "ikki", 2 },
                { "uch", 3 },
                { "to'rt", 4 },
                { "tort", 4 },
                { "besh", 5 },
                { "olti", 6 },
                { "odnokomnatnaya", 1 },
                { "dvuxkomnatnaya", 2 },
                { "tryoxkomnatnaya", 3 },
                { "chetyryoxkomnatnaya", 4 },
                { "studiya", 1 }
            };

        public ValueTask<PropertySearchParams> ParseQueryAsync(string rawQuery)
        {
            if (string.IsNullOrWhiteSpace(rawQuery))
            {
                return new ValueTask<PropertySearchParams>(new PropertySearchParams());
            }

            var query = rawQuery.ToLowerInvariant();
            var searchParams = new PropertySearchParams();

            // 1. Extract Room count (Numeric or text numbers)
            ExtractRooms(ref query, searchParams);

            // 2. Extract Price bounds
            ExtractPriceRange(ref query, searchParams);

            // 3. Extract Listing Type (Rent vs Sale vs ShortTermRent)
            ExtractListingType(ref query, searchParams);

            // 4. Extract Property Type (Apartment, House, Commercial, etc.)
            ExtractPropertyType(ref query, searchParams);

            // 5. Extract Districts and Regions
            ExtractLocation(ref query, searchParams);

            // 6. Extract Amenities (Metro, Wifi, Parking, Pool, Furniture, Renovation)
            ExtractAmenities(ref query, searchParams);

            // 7. Cleanup remaining keywords to pass as free-text SearchQuery
            string cleaned = CleanupRemainingText(query);
            searchParams.SearchQuery = string.IsNullOrWhiteSpace(cleaned) ? null : cleaned;

            return new ValueTask<PropertySearchParams>(searchParams);
        }

        private static void ExtractRooms(ref string query, PropertySearchParams searchParams)
        {
            // Word-based: "uch xonali", "bir xona", "studiya"
            foreach (var kvp in WordToRooms)
            {
                var pattern = $@"\b{Regex.Escape(kvp.Key)}\s*(?:xona|xonali|xonalik|komnat|x)?\b";
                if (Regex.IsMatch(query, pattern))
                {
                    searchParams.Bedrooms = kvp.Value;
                    query = Regex.Replace(query, pattern, " ");
                    return;
                }
            }

            // Numeric: "3 xona", "3-xonali", "2x", "4k"
            var roomMatch = Regex.Match(query, @"\b(\d+)\s*[-]?\s*(?:xona|xonali|xonalik|komnat|x|k)\b");
            if (roomMatch.Success && int.TryParse(roomMatch.Groups[1].Value, out int rooms))
            {
                searchParams.Bedrooms = rooms;
                query = query.Remove(roomMatch.Index, roomMatch.Length).Insert(roomMatch.Index, " ");
            }
        }

        private static void ExtractPriceRange(ref string query, PropertySearchParams searchParams)
        {
            // Range: "300 dan 500 gacha", "300-500$"
            var rangeMatch = Regex.Match(query, @"\b(\d+)\s*(?:dan|-)\s*(\d+)\s*(?:\$|dollar|usd|sum|so'm)?\s*(?:gacha)?\b");
            if (rangeMatch.Success)
            {
                if (decimal.TryParse(rangeMatch.Groups[1].Value, out decimal min))
                    searchParams.MinPrice = min;
                if (decimal.TryParse(rangeMatch.Groups[2].Value, out decimal max))
                    searchParams.MaxPrice = max;

                query = query.Remove(rangeMatch.Index, rangeMatch.Length).Insert(rangeMatch.Index, " ");
                return;
            }

            // Upper bound: "500$ gacha", "500 dollargacha", "500 gacha"
            var maxMatch = Regex.Match(query, @"\b(\d+)\s*(?:ming|k)?\s*(?:\$|dollar|usd|sum|so'm)?\s*(?:gacha|dan arzon|maksimal)\b");
            if (maxMatch.Success && decimal.TryParse(maxMatch.Groups[1].Value, out decimal maxPrice))
            {
                if (maxMatch.Value.Contains("ming") || maxMatch.Value.Contains("k"))
                    maxPrice *= 1000m;
                searchParams.MaxPrice = maxPrice;
                query = query.Remove(maxMatch.Index, maxMatch.Length).Insert(maxMatch.Index, " ");
                return;
            }

            // Lower bound: "300$ dan baland", "300 dan yuqori"
            var minMatch = Regex.Match(query, @"\b(\d+)\s*(?:ming|k)?\s*(?:\$|dollar|usd|sum|so'm)?\s*(?:dan yuqori|dan baland|kamida)\b");
            if (minMatch.Success && decimal.TryParse(minMatch.Groups[1].Value, out decimal minPrice))
            {
                if (minMatch.Value.Contains("ming") || minMatch.Value.Contains("k"))
                    minPrice *= 1000m;
                searchParams.MinPrice = minPrice;
                query = query.Remove(minMatch.Index, minMatch.Length).Insert(minMatch.Index, " ");
                return;
            }

            // Specific price with currency symbol: "500$" or "500 dollar"
            var singlePriceMatch = Regex.Match(query, @"\b(\d+)\s*(?:\$|dollar|usd)\b");
            if (singlePriceMatch.Success && decimal.TryParse(singlePriceMatch.Groups[1].Value, out decimal price))
            {
                searchParams.MaxPrice = price;
                query = query.Remove(singlePriceMatch.Index, singlePriceMatch.Length).Insert(singlePriceMatch.Index, " ");
            }
        }

        private static void ExtractListingType(ref string query, PropertySearchParams searchParams)
        {
            if (Regex.IsMatch(query, @"\b(kunlik|sutka|sutochno|posutochno|kuniga)\b"))
            {
                searchParams.ListingType = ListingType.ShortTermRent;
                query = Regex.Replace(query, @"\b(kunlik|sutka|sutochno|posutochno|kuniga)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(ijara|ijaraga|arenda|arendaga|snyat)\b"))
            {
                searchParams.ListingType = ListingType.Rent;
                query = Regex.Replace(query, @"\b(ijara|ijaraga|arenda|arendaga|snyat)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(sotiladi|sotish|sotib olish|olmoqchiman|sotuv|kupit|prodaja)\b"))
            {
                searchParams.ListingType = ListingType.Sale;
                query = Regex.Replace(query, @"\b(sotiladi|sotish|sotib olish|olmoqchiman|sotuv|kupit|prodaja)\b", " ");
            }
        }

        private static void ExtractPropertyType(ref string query, PropertySearchParams searchParams)
        {
            if (Regex.IsMatch(query, @"\b(hovli|uchastka|kottej|dacha|dom)\b"))
            {
                searchParams.PropertyType = PropertyType.House;
                query = Regex.Replace(query, @"\b(hovli|uchastka|kottej|dacha|dom)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(kvartira|novostroyka|yangi bino|etajka)\b"))
            {
                searchParams.PropertyType = PropertyType.Apartment;
                query = Regex.Replace(query, @"\b(kvartira|novostroyka|yangi bino|etajka)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(villa|rezidensiya)\b"))
            {
                searchParams.PropertyType = PropertyType.Villa;
                query = Regex.Replace(query, @"\b(villa|rezidensiya)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(ofis|magazin|do'kon|dokon|noturar|ombor|restoran|kafe)\b"))
            {
                searchParams.PropertyType = PropertyType.Commercial;
                query = Regex.Replace(query, @"\b(ofis|magazin|do'kon|dokon|noturar|ombor|restoran|kafe)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(yer|yer uchastkasi|uchastok)\b"))
            {
                searchParams.PropertyType = PropertyType.Land;
                query = Regex.Replace(query, @"\b(yer|yer uchastkasi|uchastok)\b", " ");
            }
        }

        private static void ExtractLocation(ref string query, PropertySearchParams searchParams)
        {
            // First check districts (they imply region)
            foreach (var kvp in DistrictMappings)
            {
                var pattern = $@"\b{Regex.Escape(kvp.Key)}(?:da|dagi|dan|ga|ning|i)?\b";
                if (Regex.IsMatch(query, pattern))
                {
                    searchParams.District = kvp.Value.DistrictName;
                    searchParams.Region = kvp.Value.Region.ToString();
                    searchParams.City = "Toshkent";
                    query = Regex.Replace(query, pattern, " ");
                    break;
                }
            }

            // Then check regions if not already identified
            if (string.IsNullOrWhiteSpace(searchParams.Region))
            {
                foreach (var kvp in RegionMappings)
                {
                    var pattern = $@"\b{Regex.Escape(kvp.Key)}(?:da|dagi|dan|ga|ning|i| viloyati| viloyat)?\b";
                    if (Regex.IsMatch(query, pattern))
                    {
                        searchParams.Region = kvp.Value.ToString();
                        searchParams.City = kvp.Key;
                        query = Regex.Replace(query, pattern, " ");
                        break;
                    }
                }
            }
        }

        private static void ExtractAmenities(ref string query, PropertySearchParams searchParams)
        {
            if (Regex.IsMatch(query, @"\b(metro|metrogacha|metroga yaqin|metro yaqinida)\b"))
            {
                searchParams.HasMetroNearby = true;
                query = Regex.Replace(query, @"\b(metro|metrogacha|metroga yaqin|metro yaqinida)\b", " ");
            }

            if (Regex.IsMatch(query, @"\b(wifi|vayfay|internet)\b"))
            {
                searchParams.HasWifi = true;
                query = Regex.Replace(query, @"\b(wifi|vayfay|internet)\b", " ");
            }

            if (Regex.IsMatch(query, @"\b(parkovka|garaj|avtoturargoh)\b"))
            {
                searchParams.HasParking = true;
                query = Regex.Replace(query, @"\b(parkovka|garaj|avtoturargoh)\b", " ");
            }

            if (Regex.IsMatch(query, @"\b(basseyn|hovuz|basseynli)\b"))
            {
                searchParams.HasPool = true;
                query = Regex.Replace(query, @"\b(basseyn|hovuz|basseynli)\b", " ");
            }

            if (Regex.IsMatch(query, @"\b(mebel|mebelli|jihozlangan)\b"))
            {
                searchParams.HasFurniture = true;
                query = Regex.Replace(query, @"\b(mebel|mebelli|jihozlangan)\b", " ");
            }

            if (Regex.IsMatch(query, @"\b(evroremont|yevrota'mir|lyuks|euro)\b"))
            {
                searchParams.IsRenovated = true;
                searchParams.RenovationLevel = RenovationLevel.EuroLux;
                query = Regex.Replace(query, @"\b(evroremont|yevrota'mir|lyuks|euro)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(korobka|qora suvoq)\b"))
            {
                searchParams.RenovationLevel = RenovationLevel.ShellAndCore;
                query = Regex.Replace(query, @"\b(korobka|qora suvoq)\b", " ");
            }
            else if (Regex.IsMatch(query, @"\b(remontli|ta'mirlangan|yangi remont)\b"))
            {
                searchParams.IsRenovated = true;
                query = Regex.Replace(query, @"\b(remontli|ta'mirlangan|yangi remont)\b", " ");
            }
        }

        private static string CleanupRemainingText(string query)
        {
            // Remove common stop words and search filler phrases
            var stopWords = @"\b(kerak|izlayapman|qidiryapman|topib ber|arzon|qulay|yaxshi|bormi|uy|uylar|joy|uchun|va|bilan|ham)\b";
            var cleaned = Regex.Replace(query, stopWords, " ");
            cleaned = Regex.Replace(cleaned, @"[^\w\s]", " ");
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();
            return cleaned;
        }
    }
}
