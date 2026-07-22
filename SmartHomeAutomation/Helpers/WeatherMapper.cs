namespace SmartHomeAutomation.Helpers
{
    public static class WeatherMapper
    {
        public static (string Condition, string Icon) MapCode(int code, bool isDay)
        {
            return code switch
            {
                0 => ("Clear Sky", isDay ? "clear-day" : "clear-night"),
                1 => ("Mainly Clear", isDay ? "clear-day" : "clear-night"),
                2 => ("Partly Cloudy", isDay ? "cloudy-day" : "cloudy-night"),
                3 => ("Overcast", "cloudy"),
                45 or 48 => ("Foggy", "fog"),
                51 or 53 or 55 => ("Drizzle", "drizzle"),
                56 or 57 => ("Freezing Drizzle", "freezing-drizzle"),
                61 or 63 or 65 => ("Rainy", "rain"),
                66 or 67 => ("Freezing Rain", "freezing-rain"),
                71 or 73 or 75 => ("Snowy", "snow"),
                77 => ("Snow Grains", "snow"),
                80 or 81 or 82 => ("Rain Showers", "showers"),
                85 or 86 => ("Snow Showers", "snow"),
                95 => ("Thunderstorm", "thunderstorm"),
                96 or 99 => ("Thunderstorm with Hail", "thunderstorm"),
                _ => ("Unknown", "unknown")
            };
        }
    }
}
