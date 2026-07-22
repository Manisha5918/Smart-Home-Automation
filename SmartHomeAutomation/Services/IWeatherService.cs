using System.Collections.Generic;
using System.Threading.Tasks;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public interface IWeatherService
    {
        Task<WeatherResponse> GetCurrentWeatherAsync(double? latitude = null, double? longitude = null);
        Task<IEnumerable<HourlyForecast>> GetHourlyForecastAsync(double? latitude = null, double? longitude = null);
        Task<IEnumerable<DailyForecast>> GetDailyForecastAsync(double? latitude = null, double? longitude = null);
        Task<AirQualityResponse> GetAirQualityAsync(double? latitude = null, double? longitude = null);
        Task<WeatherSummaryResponse> GetWeatherSummaryAsync(double? latitude = null, double? longitude = null);
        Task<IEnumerable<WeatherAlert>> GetWeatherAlertsAsync(double? latitude = null, double? longitude = null);
        Task<IEnumerable<AISuggestion>> GetAutomationSuggestionsAsync(int userId, double? latitude = null, double? longitude = null);
    }
}
