using System;

namespace SmartHomeAutomation.Models
{
    public class HourlyForecast
    {
        public DateTime Time { get; set; }
        public string WeatherIcon { get; set; } = string.Empty;
        public double Temperature { get; set; }
        public double RainProbability { get; set; }
    }
}
