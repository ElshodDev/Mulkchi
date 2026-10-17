using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.AI;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Services.Foundations.AI
{
    public class PropertyFraudDetectionService : IPropertyFraudDetectionService
    {
        private readonly IStorageBroker storageBroker;
        private readonly IPriceRecommendationService priceRecommendationService;
        private readonly ILoggingBroker loggingBroker;

        // Common scam / bait-and-switch phrases in Uzbek and Russian
        private static readonly string[] SuspiciousPatterns = new[]
        {
            @"\b(avans|oldindan\s+to['`]?lov|zakalad|karta\s*raqam|kartaga\s*(?:pul|o['`]?tkaz|tashlang)|predoplata|na\s+kartu)\b",
            @"\b(faqat\s+telegram(?:dan)?\s+yozing|telefon\s+qilmang|ne\s+zvonit|tolko\s+telegram)\b",
            @"\b(shoshilinch\s+arzon|срочно\s+дешево|chetdaman|zarur\s+pul\s+kerak)\b"
        };

        public PropertyFraudDetectionService(
            IStorageBroker storageBroker,
            IPriceRecommendationService priceRecommendationService,
            ILoggingBroker loggingBroker)
        {
            this.storageBroker = storageBroker;
            this.priceRecommendationService = priceRecommendationService;
            this.loggingBroker = loggingBroker;
        }

        public async Task<FraudAssessmentResult> AssessPropertyRiskByIdAsync(Guid propertyId)
        {
            Property property = await this.storageBroker.SelectPropertyByIdAsync(propertyId);
            if (property == null)
            {
                throw new KeyNotFoundException($"Property with ID '{propertyId}' not found.");
            }

            return await AssessPropertyRiskAsync(property);
        }

        public async Task<FraudAssessmentResult> AssessPropertyRiskAsync(Property property)
        {
            var result = new FraudAssessmentResult
            {
                PropertyId = property.Id,
                RiskScore = 0
            };

            decimal actualPrice = property.ListingType switch
            {
                ListingType.Rent => property.MonthlyRent ?? property.Price,
                ListingType.ShortTermRent => property.PricePerNight ?? property.Price,
                _ => property.SalePrice ?? property.Price
            };
            result.ActualPrice = actualPrice;

            // 1. Price Anomaly Check via AI Valuation & Market Benchmark
            await EvaluatePriceAnomalyAsync(property, actualPrice, result);

            // 2. Suspicious Description & Prepayment Scam Analysis
            EvaluateContentPatterns(property, result);

            // 3. Host Profile & Identity Verification Check
            await EvaluateHostCredibilityAsync(property, result);

            // 4. Media & Completeness Check
            await EvaluateMediaIntegrityAsync(property, result);

            // Final Risk Level Mapping
            result.RiskScore = Math.Clamp(result.RiskScore, 0, 100);
            result.IsSuspicious = result.RiskScore >= 50;

            result.RiskLevel = result.RiskScore switch
            {
                >= 75 => "Critical",
                >= 50 => "High",
                >= 25 => "Medium",
                _ => "Low"
            };

            result.Recommendation = result.RiskLevel switch
            {
                "Critical" => "Diqqat! Ushbu e'lon firibgarlik (fake/avans) alomatlariga ega. Hech qachon uyni o'z ko'zingiz bilan ko'rmasdan oldindan pul o'tkazmang!",
                "High" => "Ehtiyot bo'ling! E'lon parametrlari bozor me'yorlariga mos kelmaydi yoki uy egasi tasdiqlanmagan.",
                "Medium" => "E'lon qoniqarli, ammo to'lov qilishdan oldin uy hujjatlarini va shaxsni tekshirishingizni tavsiya qilamiz.",
                _ => "Xavfsiz va ishonchli e'lon. Narx va shartlar bozor talablariga to'la mos keladi."
            };

            return result;
        }

        private async Task EvaluatePriceAnomalyAsync(Property property, decimal actualPrice, FraudAssessmentResult result)
        {
            if (property.Area <= 0 || actualPrice <= 0)
            {
                result.RiskScore += 20;
                result.RiskFactors.Add("Mulk maydoni yoki narxi noto'g'ri ko'rsatilgan.");
                return;
            }

            try
            {
                var priceRequest = new PriceRecommendationRequest
                {
                    Area = (float)property.Area,
                    Bedrooms = property.NumberOfBedrooms,
                    Bathrooms = property.NumberOfBathrooms,
                    Region = (int)property.Region,
                    District = property.District ?? string.Empty,
                    Latitude = property.Latitude,
                    Longitude = property.Longitude,
                    ListingType = property.ListingType,
                    BuildingType = property.BuildingType,
                    RenovationLevel = property.RenovationLevel,
                    HasWifi = property.HasWifi,
                    HasParking = property.HasParking,
                    HasPool = property.HasPool,
                    HasElevator = property.HasElevator,
                    IsRenovated = property.IsRenovated
                };

                var prediction = await this.priceRecommendationService.PredictPriceAsync(priceRequest);
                result.ExpectedMarketPrice = prediction.PredictedPrice;

                if (prediction.PredictedPrice > 0)
                {
                    decimal ratio = actualPrice / prediction.PredictedPrice;
                    decimal deviationPercent = Math.Round((1.0m - ratio) * 100m, 1);
                    result.PriceDeviationPercent = deviationPercent;

                    // Suspiciously cheap (often bait-and-switch or advance fee fraud)
                    if (ratio < 0.35m)
                    {
                        result.RiskScore += 45;
                        result.RiskFactors.Add($"Narx bozor narxidan {deviationPercent}% ga shubhali darajada arzon (kutilgan: ~${prediction.PredictedPrice:N0}, ko'rsatilgan: ${actualPrice:N0}).");
                    }
                    else if (ratio < 0.50m)
                    {
                        result.RiskScore += 25;
                        result.RiskFactors.Add($"Narx bozor me'yoridan ancha past ({deviationPercent}% farq). Ehtiyotkorlik talab etiladi.");
                    }
                    // Suspiciously astronomical (possible fake/testing entry)
                    else if (ratio > 3.0m)
                    {
                        result.RiskScore += 15;
                        result.RiskFactors.Add("Narx hududdagi o'rtacha bozor narxidan 3 barobardan ko'proq yuqori.");
                    }
                }
            }
            catch (Exception ex)
            {
                this.loggingBroker.LogWarning($"Price anomaly check skipped due to prediction error: {ex.Message}");
            }
        }

        private static void EvaluateContentPatterns(Property property, FraudAssessmentResult result)
        {
            string content = $"{property.Title} {property.Description}".ToLowerInvariant();

            foreach (var pattern in SuspiciousPatterns)
            {
                if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
                {
                    result.RiskScore += 30;
                    result.RiskFactors.Add("E'lon matnida oldindan avans/karta so'rovi yoki shubhali aloqa shartlari aniqlandi.");
                    break;
                }
            }

            // Short/empty description for high-value properties
            if (string.IsNullOrWhiteSpace(property.Description) || property.Description.Trim().Length < 15)
            {
                result.RiskScore += 10;
                result.RiskFactors.Add("E'lon tavsifi juda qisqa yoki ma'lumotsiz.");
            }
        }

        private async Task EvaluateHostCredibilityAsync(Property property, FraudAssessmentResult result)
        {
            try
            {
                User host = await this.storageBroker.SelectUserByIdAsync(property.HostId);
                if (host != null)
                {
                    if (!host.IsVerified)
                    {
                        result.RiskScore += 15;
                        result.RiskFactors.Add("Uy egasining shaxsi (OneID/Pasport) orqali hali tasdiqlanmagan.");
                    }

                    if (!host.EmailConfirmed && string.IsNullOrWhiteSpace(host.Phone))
                    {
                        result.RiskScore += 15;
                        result.RiskFactors.Add("Uy egasining tasdiqlangan telefon raqami yoki emaili mavjud emas.");
                    }
                }
                else
                {
                    result.RiskScore += 20;
                    result.RiskFactors.Add("E'lon egasi tizimda topilmadi.");
                }
            }
            catch (Exception ex)
            {
                this.loggingBroker.LogWarning($"Host credibility check encountered an error: {ex.Message}");
            }
        }

        private async Task EvaluateMediaIntegrityAsync(Property property, FraudAssessmentResult result)
        {
            try
            {
                int imageCount = await this.storageBroker.SelectAllPropertyImages()
                    .Where(img => img.PropertyId == property.Id && img.DeletedDate == null)
                    .CountAsync();

                if (imageCount == 0)
                {
                    result.RiskScore += 20;
                    result.RiskFactors.Add("E'londa birorta ham haqiqiy rasm mavjud emas.");
                }
                else if (imageCount == 1)
                {
                    result.RiskScore += 5;
                    result.RiskFactors.Add("E'londa faqat bitta rasm mavjud.");
                }
            }
            catch (Exception ex)
            {
                this.loggingBroker.LogWarning($"Media integrity check error: {ex.Message}");
            }
        }
    }
}
