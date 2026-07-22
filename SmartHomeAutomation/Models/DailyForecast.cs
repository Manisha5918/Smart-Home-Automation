using System;

namespace SmartHomeAutomation.Models
{
    public class DailyForecast
    {
        public string Day { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string WeatherIcon { get; set; } = string.Empty;
        public double HighTemperature { get; set; }
        public double LowTemperature { get; set; }
        public double RainChance { get; set; }
        public string WeatherCondition { get; set; } = string.Empty;
    }
}
