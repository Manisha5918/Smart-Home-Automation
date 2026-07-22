using System;

namespace SmartHomeAutomation.Models
{
    public class WeatherSummaryResponse
    {
        public string Summary { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
    }
}
