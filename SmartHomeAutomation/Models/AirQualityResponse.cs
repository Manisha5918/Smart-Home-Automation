using System;

namespace SmartHomeAutomation.Models
{
    public class AirQualityResponse
    {
        public double Aqi { get; set; }
        public double Pm25 { get; set; }
        public double Pm10 { get; set; }
        public double Co { get; set; }
        public double No2 { get; set; }
        public double O3 { get; set; }
        public string Status { get; set; } = string.Empty; // Excellent, Good, Moderate, Poor, Very Poor
        public DateTime RecordedAt { get; set; }
    }
}
