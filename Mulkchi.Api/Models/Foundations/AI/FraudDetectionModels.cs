using System;
using System.Collections.Generic;

namespace Mulkchi.Api.Models.Foundations.AI
{
    public class FraudAssessmentResult
    {
        public Guid PropertyId { get; set; }
        public bool IsSuspicious { get; set; }
        public int RiskScore { get; set; }
        public string RiskLevel { get; set; } = "Low";
        public List<string> RiskFactors { get; set; } = new();
        public decimal? ExpectedMarketPrice { get; set; }
        public decimal? ActualPrice { get; set; }
        public decimal? PriceDeviationPercent { get; set; }
        public string Recommendation { get; set; } = string.Empty;
    }
}
