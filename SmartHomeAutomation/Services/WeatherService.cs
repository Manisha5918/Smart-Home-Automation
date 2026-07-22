using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Helpers;
using SmartHomeAutomation.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace SmartHomeAutomation.Services
{
    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        private readonly ApplicationDbContext _context;
        private readonly OllamaService _ollamaService;

        public WeatherService(
            HttpClient httpClient,
            IConfiguration configuration,
            IMemoryCache cache,
            ApplicationDbContext context,
            OllamaService ollamaService)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _cache = cache;
            _context = context;
            _ollamaService = ollamaService;
        }

        private class CachedWeatherData
        {
            public WeatherResponse CurrentWeather { get; set; } = null!;
            public List<HourlyForecast> HourlyForecasts { get; set; } = null!;
            public List<DailyForecast> DailyForecasts { get; set; } = null!;
            public AirQualityResponse AirQuality { get; set; } = null!;
            public List<WeatherAlert> Alerts { get; set; } = null!;
            public DateTime CachedAt { get; set; }
        }

        private async Task<CachedWeatherData> GetOrFetchCombinedWeatherDataAsync(double? reqLat = null, double? reqLon = null)
        {
            var lat = reqLat ?? _configuration.GetValue<double>("Weather:Latitude", 11.0168);
            var lon = reqLon ?? _configuration.GetValue<double>("Weather:Longitude", 76.9558);
            var resolvedCity = reqLat == null && reqLon == null
                ? _configuration.GetValue<string>("Weather:City", "Coimbatore")
                : "My Location";

            var cacheKey = $"CombinedWeatherData_{lat:F4}_{lon:F4}";
            if (_cache.TryGetValue(cacheKey, out CachedWeatherData? cached) && cached != null)
            {
                return cached;
            }

            var weatherUrl = $"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility&hourly=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum&timezone=auto";
            var aqUrl = $"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto";

            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("SmartHomeAutomation/1.0");

            var weatherTask = _httpClient.GetAsync(weatherUrl);
            var aqTask = _httpClient.GetAsync(aqUrl);

            await Task.WhenAll(weatherTask, aqTask);

            var weatherResponse = await weatherTask;
            weatherResponse.EnsureSuccessStatusCode();
            var weatherJson = await weatherResponse.Content.ReadAsStringAsync();

            var aqResponse = await aqTask;
            aqResponse.EnsureSuccessStatusCode();
            var aqJson = await aqResponse.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var rawWeather = JsonSerializer.Deserialize<OpenMeteoWeatherResponse>(weatherJson, options);
            var rawAq = JsonSerializer.Deserialize<OpenMeteoAirQualityResponse>(aqJson, options);

            if (rawWeather == null || rawAq == null)
            {
                throw new InvalidOperationException("Failed to fetch or deserialize weather/air-quality data.");
            }

            // Perform mappings
            var timezone = rawWeather.Timezone;
            var current = rawWeather.Current;
            var (condition, icon) = WeatherMapper.MapCode(current.Weather_Code, current.Is_Day == 1);

            // Find current hour's rain probability
            double rainProb = 0;
            if (rawWeather.Hourly != null && rawWeather.Hourly.Time != null && rawWeather.Hourly.Time.Count > 0)
            {
                var currentHourStr = DateTime.Parse(current.Time).ToString("yyyy-MM-ddTHH:00");
                int idx = rawWeather.Hourly.Time.FindIndex(t => t.StartsWith(currentHourStr) || t == currentHourStr);
                if (idx != -1 && idx < rawWeather.Hourly.Precipitation_Probability.Count)
                {
                    rainProb = rawWeather.Hourly.Precipitation_Probability[idx];
                }
            }

            var currentWeather = new WeatherResponse
            {
                Temperature = current.Temperature_2m,
                FeelsLike = current.Apparent_Temperature,
                Humidity = current.Relative_Humidity_2m,
                WeatherCondition = condition,
                WeatherIcon = icon,
                WindSpeed = current.Wind_Speed_10m,
                WindDirection = current.Wind_Direction_10m,
                WindGust = current.Wind_Gusts_10m,
                Pressure = current.Pressure_Msl,
                UvIndex = current.Uv_Index,
                CloudCover = current.Cloud_Cover,
                Visibility = current.Visibility,
                RainProbability = rainProb == 0 && rawWeather.Daily != null && rawWeather.Daily.Precipitation_Probability_max != null && rawWeather.Daily.Precipitation_Probability_max.Count > 0 ? rawWeather.Daily.Precipitation_Probability_max[0] : rainProb,
                RainAmount = current.Rain > 0 ? current.Rain : current.Precipitation,
                Sunrise = rawWeather.Daily != null && rawWeather.Daily.Sunrise.Count > 0 ? DateTime.Parse(rawWeather.Daily.Sunrise[0]) : DateTime.MinValue,
                Sunset = rawWeather.Daily != null && rawWeather.Daily.Sunset.Count > 0 ? DateTime.Parse(rawWeather.Daily.Sunset[0]) : DateTime.MinValue,
                City = resolvedCity,
                Timezone = timezone,
                LastUpdated = DateTime.Parse(current.Time)
            };

            // Hourly Forecast (Next 24 Hours)
            var hourlyForecasts = new List<HourlyForecast>();
            if (rawWeather.Hourly != null && rawWeather.Hourly.Time != null)
            {
                var currentParsed = DateTime.Parse(current.Time);
                int startIndex = 0;
                double minDiff = double.MaxValue;
                for (int i = 0; i < rawWeather.Hourly.Time.Count; i++)
                {
                    var hTime = DateTime.Parse(rawWeather.Hourly.Time[i]);
                    var diff = Math.Abs((hTime - currentParsed).TotalMinutes);
                    if (diff < minDiff)
                    {
                        minDiff = diff;
                        startIndex = i;
                    }
                }

                int count = Math.Min(24, rawWeather.Hourly.Time.Count - startIndex);
                for (int i = startIndex; i < startIndex + count; i++)
                {
                    var time = DateTime.Parse(rawWeather.Hourly.Time[i]);
                    var (_, hourlyIcon) = WeatherMapper.MapCode(rawWeather.Hourly.Weather_Code[i], time.Hour >= 6 && time.Hour <= 18);
                    hourlyForecasts.Add(new HourlyForecast
                    {
                        Time = time,
                        WeatherIcon = hourlyIcon,
                        Temperature = rawWeather.Hourly.Temperature_2m[i],
                        RainProbability = rawWeather.Hourly.Precipitation_Probability[i]
                    });
                }
            }

            // Daily Forecast (Next 7 Days)
            var dailyForecasts = new List<DailyForecast>();
            if (rawWeather.Daily != null && rawWeather.Daily.Time != null)
            {
                for (int i = 0; i < rawWeather.Daily.Time.Count; i++)
                {
                    var date = DateTime.Parse(rawWeather.Daily.Time[i]);
                    var (dailyCond, dailyIcon) = WeatherMapper.MapCode(rawWeather.Daily.Weather_Code[i], true);
                    dailyForecasts.Add(new DailyForecast
                    {
                        Day = date.ToString("dddd"),
                        Date = date,
                        WeatherIcon = dailyIcon,
                        HighTemperature = rawWeather.Daily.Temperature_2m_max[i],
                        LowTemperature = rawWeather.Daily.Temperature_2m_min[i],
                        RainChance = rawWeather.Daily.Precipitation_Probability_max[i],
                        WeatherCondition = dailyCond
                    });
                }
            }

            // Air Quality
            var currentAq = rawAq.Current;
            var usAqiVal = currentAq.Us_Aqi;
            string aqStatus = usAqiVal switch
            {
                <= 50 => "Excellent",
                <= 100 => "Good",
                <= 150 => "Moderate",
                <= 200 => "Poor",
                _ => "Very Poor"
            };

            var airQuality = new AirQualityResponse
            {
                Aqi = usAqiVal,
                Pm25 = currentAq.Pm2_5,
                Pm10 = currentAq.Pm10,
                Co = currentAq.Carbon_Monoxide,
                No2 = currentAq.Nitrogen_Dioxide,
                O3 = currentAq.Ozone,
                Status = aqStatus,
                RecordedAt = DateTime.Parse(currentAq.Time)
            };

            // Alerts
            var alerts = new List<WeatherAlert>();
            if (currentWeather.Temperature > 35)
            {
                alerts.Add(new WeatherAlert
                {
                    Severity = "High",
                    Title = "Heat Advisory",
                    Message = $"Outdoor temperature is extremely high ({currentWeather.Temperature}°C). Take precautions to stay cool and hydrated.",
                    IssuedAt = DateTime.Now
                });
            }
            if (currentWeather.RainProbability > 70 || currentWeather.RainAmount > 5)
            {
                alerts.Add(new WeatherAlert
                {
                    Severity = "Medium",
                    Title = "Heavy Rain Advisory",
                    Message = $"Rain probability is high ({currentWeather.RainProbability}%). Ensure windows are closed and outdoor equipment is covered.",
                    IssuedAt = DateTime.Now
                });
            }
            if (currentWeather.WindSpeed > 40)
            {
                alerts.Add(new WeatherAlert
                {
                    Severity = "High",
                    Title = "Strong Wind Warning",
                    Message = $"Wind speeds are currently {currentWeather.WindSpeed} km/h with gusts up to {currentWeather.WindGust} km/h. Secure loose outdoor objects.",
                    IssuedAt = DateTime.Now
                });
            }
            if (currentWeather.UvIndex > 7)
            {
                alerts.Add(new WeatherAlert
                {
                    Severity = "Medium",
                    Title = "High UV Alert",
                    Message = $"UV Index is high ({currentWeather.UvIndex}). Wear sun protection and limit direct sun exposure.",
                    IssuedAt = DateTime.Now
                });
            }
            if (airQuality.Aqi > 100)
            {
                alerts.Add(new WeatherAlert
                {
                    Severity = "High",
                    Title = "Poor Air Quality Alert",
                    Message = $"Air Quality Index is poor ({airQuality.Aqi} - {airQuality.Status}). Avoid prolonged outdoor activity.",
                    IssuedAt = DateTime.Now
                });
            }

            var combined = new CachedWeatherData
            {
                CurrentWeather = currentWeather,
                HourlyForecasts = hourlyForecasts,
                DailyForecasts = dailyForecasts,
                AirQuality = airQuality,
                Alerts = alerts,
                CachedAt = DateTime.Now
            };

            _cache.Set(cacheKey, combined, TimeSpan.FromMinutes(10));
            return combined;
        }

        public async Task<WeatherResponse> GetCurrentWeatherAsync(double? latitude = null, double? longitude = null)
        {
            var data = await GetOrFetchCombinedWeatherDataAsync(latitude, longitude);
            return data.CurrentWeather;
        }

        public async Task<IEnumerable<HourlyForecast>> GetHourlyForecastAsync(double? latitude = null, double? longitude = null)
        {
            var data = await GetOrFetchCombinedWeatherDataAsync(latitude, longitude);
            return data.HourlyForecasts;
        }

        public async Task<IEnumerable<DailyForecast>> GetDailyForecastAsync(double? latitude = null, double? longitude = null)
        {
            var data = await GetOrFetchCombinedWeatherDataAsync(latitude, longitude);
            return data.DailyForecasts;
        }

        public async Task<AirQualityResponse> GetAirQualityAsync(double? latitude = null, double? longitude = null)
        {
            var data = await GetOrFetchCombinedWeatherDataAsync(latitude, longitude);
            return data.AirQuality;
        }

        public async Task<IEnumerable<WeatherAlert>> GetWeatherAlertsAsync(double? latitude = null, double? longitude = null)
        {
            var data = await GetOrFetchCombinedWeatherDataAsync(latitude, longitude);
            return data.Alerts;
        }

        public async Task<WeatherSummaryResponse> GetWeatherSummaryAsync(double? latitude = null, double? longitude = null)
        {
            var data = await GetOrFetchCombinedWeatherDataAsync(latitude, longitude);
            var current = data.CurrentWeather;
            var aq = data.AirQuality;

            var systemPrompt = "You are a smart home weather analyst. Analyze the current weather and air quality to generate a brief, professional smart home summary recommendation for the user. Return ONLY 2-3 sentences. Suggest how they might optimize comfort and energy usage based on the conditions.";
            var userMessage = $"Current Weather:\n" +
                              $"- Temperature: {current.Temperature}°C\n" +
                              $"- Feels Like: {current.FeelsLike}°C\n" +
                              $"- Humidity: {current.Humidity}%\n" +
                              $"- Condition: {current.WeatherCondition}\n" +
                              $"- Rain Probability: {current.RainProbability}%\n" +
                              $"- UV Index: {current.UvIndex}\n" +
                              $"- Wind Speed: {current.WindSpeed} km/h\n" +
                              $"- Air Quality Index: {aq.Aqi} ({aq.Status})";

            string summary;
            try
            {
                summary = await _ollamaService.ChatAsync(systemPrompt, userMessage);
            }
            catch (Exception ex)
            {
                summary = $"Warm and humid conditions are expected today with temperature of {current.Temperature}°C and {current.Humidity}% humidity. Consider running the AC in Eco Mode during the afternoon to maintain comfort while reducing energy usage.";
                Console.WriteLine($"Ollama summary generation failed: {ex.Message}");
            }

            return new WeatherSummaryResponse
            {
                Summary = summary.Trim(),
                GeneratedAt = DateTime.Now
            };
        }

        public async Task<IEnumerable<AISuggestion>> GetAutomationSuggestionsAsync(int userId, double? latitude = null, double? longitude = null)
        {
            var userDevices = await _context.Devices
                .Where(d => d.UserId == userId)
                .ToListAsync();

            var data = await GetOrFetchCombinedWeatherDataAsync(latitude, longitude);
            var current = data.CurrentWeather;
            var aq = data.AirQuality;

            var suggestions = new List<AISuggestion>();

            foreach (var dev in userDevices)
            {
                var nameLower = dev.Name.ToLowerInvariant();
                var typeLower = dev.Type.ToLowerInvariant();

                bool isAc = typeLower == "ac" || typeLower.Contains("conditioner") || nameLower.Contains("ac") || nameLower.Contains("air conditioner");
                bool isFan = typeLower.Contains("fan") || nameLower.Contains("fan");
                bool isWindow = typeLower.Contains("window") || nameLower.Contains("window");
                bool isCurtain = typeLower.Contains("curtain") || typeLower.Contains("blind") || nameLower.Contains("curtain") || nameLower.Contains("blind") || nameLower.Contains("shade");
                bool isDehumidifier = typeLower.Contains("dehumidifier") || nameLower.Contains("dehumidifier") || nameLower.Contains("moisture");
                bool isWasher = typeLower.Contains("washer") || typeLower.Contains("washing") || nameLower.Contains("washer") || nameLower.Contains("washing") || nameLower.Contains("dryer") || nameLower.Contains("laundry");

                AISuggestion? newSug = null;

                if (isAc)
                {
                    if (current.Temperature > 28)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"Outdoor temperature is hot ({current.Temperature}°C). Turn ON {dev.Name} to cool the room.",
                            TriggerType = "Temperature",
                            TriggerValue = "28°C",
                            Action = "TurnOn",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                    else if (current.Temperature < 20)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"Outdoor temperature is cool ({current.Temperature}°C). Turn OFF {dev.Name} to conserve energy.",
                            TriggerType = "Temperature",
                            TriggerValue = "20°C",
                            Action = "TurnOff",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                }
                else if (isFan)
                {
                    if (current.Temperature > 24 && current.Temperature <= 28)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"Outdoor temperature is pleasant ({current.Temperature}°C). Turn ON {dev.Name} for energy-efficient circulation.",
                            TriggerType = "Temperature",
                            TriggerValue = "24°C",
                            Action = "TurnOn",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                }
                else if (isWindow)
                {
                    if (current.RainProbability > 60)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"Rain probability is high ({current.RainProbability}%). Close {dev.Name} to prevent water entry.",
                            TriggerType = "Rain",
                            TriggerValue = "60%",
                            Action = "TurnOff",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                    else if (aq.Aqi > 100)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"Outdoor air pollution is poor (AQI: {aq.Aqi}). Close {dev.Name} to protect indoor air quality.",
                            TriggerType = "AQI",
                            TriggerValue = "100",
                            Action = "TurnOff",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                }
                else if (isCurtain)
                {
                    if (current.UvIndex > 5)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"UV Index is high ({current.UvIndex}). Close {dev.Name} to block intense sunlight and greenhouse heating.",
                            TriggerType = "UV",
                            TriggerValue = "5",
                            Action = "TurnOff",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                }
                else if (isDehumidifier)
                {
                    if (current.Humidity > 70)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"Outdoor humidity is high ({current.Humidity}%). Turn ON {dev.Name} to manage indoor dampness.",
                            TriggerType = "Humidity",
                            TriggerValue = "70%",
                            Action = "TurnOn",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                }
                else if (isWasher)
                {
                    if (current.RainProbability > 70)
                    {
                        newSug = new AISuggestion
                        {
                            UserId = userId,
                            DeviceId = dev.DeviceId,
                            SuggestionType = "Weather Automation",
                            Message = $"High probability of rain ({current.RainProbability}%). Delay running {dev.Name} to avoid damp clothes.",
                            TriggerType = "Rain",
                            TriggerValue = "70%",
                            Action = "TurnOff",
                            Confidence = "High",
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };
                    }
                }

                if (newSug != null)
                {
                    var exists = await _context.AISuggestions.AnyAsync(s => 
                        s.UserId == userId && 
                        s.DeviceId == newSug.DeviceId && 
                        s.TriggerType == newSug.TriggerType && 
                        s.TriggerValue == newSug.TriggerValue &&
                        s.Action == newSug.Action &&
                        !s.IsAccepted);

                    if (!exists)
                    {
                        _context.AISuggestions.Add(newSug);
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return await _context.AISuggestions
                .Where(s => s.UserId == userId && s.SuggestionType == "Weather Automation" && !s.IsAccepted)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }
    }

    internal class OpenMeteoWeatherResponse
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Timezone { get; set; } = string.Empty;
        public OpenMeteoCurrent Current { get; set; } = null!;
        public OpenMeteoHourly Hourly { get; set; } = null!;
        public OpenMeteoDaily Daily { get; set; } = null!;
    }

    internal class OpenMeteoCurrent
    {
        public string Time { get; set; } = string.Empty;
        public double Temperature_2m { get; set; }
        public double Relative_Humidity_2m { get; set; }
        public double Apparent_Temperature { get; set; }
        public int Is_Day { get; set; }
        public int Weather_Code { get; set; }
        public double Cloud_Cover { get; set; }
        public double Pressure_Msl { get; set; }
        public double Wind_Speed_10m { get; set; }
        public double Wind_Direction_10m { get; set; }
        public double Wind_Gusts_10m { get; set; }
        public double Uv_Index { get; set; }
        public double? Visibility { get; set; }
        public double Rain { get; set; }
        public double Precipitation { get; set; }
    }

    internal class OpenMeteoHourly
    {
        public List<string> Time { get; set; } = new();
        public List<double> Temperature_2m { get; set; } = new();
        public List<int> Weather_Code { get; set; } = new();
        public List<double> Relative_Humidity_2m { get; set; } = new();
        public List<double> Precipitation_Probability { get; set; } = new();
    }

    internal class OpenMeteoDaily
    {
        public List<string> Time { get; set; } = new();
        public List<int> Weather_Code { get; set; } = new();
        public List<double> Temperature_2m_max { get; set; } = new();
        public List<double> Temperature_2m_min { get; set; } = new();
        public List<string> Sunrise { get; set; } = new();
        public List<string> Sunset { get; set; } = new();
        public List<double> Uv_Index_max { get; set; } = new();
        public List<double> Precipitation_Probability_max { get; set; } = new();
        public List<double> Precipitation_Sum { get; set; } = new();
    }

    internal class OpenMeteoAirQualityResponse
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public OpenMeteoAirQualityCurrent Current { get; set; } = null!;
    }

    internal class OpenMeteoAirQualityCurrent
    {
        public string Time { get; set; } = string.Empty;
        public double Us_Aqi { get; set; }
        public double Pm2_5 { get; set; }
        public double Pm10 { get; set; }
        public double Carbon_Monoxide { get; set; }
        public double Nitrogen_Dioxide { get; set; }
        public double Ozone { get; set; }
    }
}
