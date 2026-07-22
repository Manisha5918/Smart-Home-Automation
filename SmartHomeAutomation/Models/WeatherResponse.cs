using System;

namespace SmartHomeAutomation.Models
{
    public class WeatherResponse
    {
        public double Temperature { get; set; }
        public double FeelsLike { get; set; }
        public double Humidity { get; set; }
        public string WeatherCondition { get; set; } = string.Empty;
        public string WeatherIcon { get; set; } = string.Empty;
        public double WindSpeed { get; set; }
        public double WindDirection { get; set; }
        public double WindGust { get; set; }
        public double Pressure { get; set; }
        public double UvIndex { get; set; }
        public double CloudCover { get; set; }
        public double? Visibility { get; set; }
        public double RainProbability { get; set; }
        public double RainAmount { get; set; }
        public DateTime Sunrise { get; set; }
        public DateTime Sunset { get; set; }
        public string City { get; set; } = string.Empty;
        public string Timezone { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
    }
}
