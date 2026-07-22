using System;

namespace SmartHomeAutomation.Models
{
    public class WeatherAlert
    {
        public string Severity { get; set; } = string.Empty; // Low, Medium, High, Critical
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; }
    }
}
