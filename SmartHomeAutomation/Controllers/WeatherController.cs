using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WeatherController : ControllerBase
    {
        private readonly IWeatherService _weatherService;

        public WeatherController(IWeatherService weatherService)
        {
            _weatherService = weatherService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.Parse(userId!);
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentWeather([FromQuery] double? latitude, [FromQuery] double? longitude)
        {
            try
            {
                var result = await _weatherService.GetCurrentWeatherAsync(latitude, longitude);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve current weather.", error = ex.Message });
            }
        }

        [HttpGet("hourly")]
        public async Task<IActionResult> GetHourlyForecast([FromQuery] double? latitude, [FromQuery] double? longitude)
        {
            try
            {
                var result = await _weatherService.GetHourlyForecastAsync(latitude, longitude);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve hourly forecast.", error = ex.Message });
            }
        }

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyForecast([FromQuery] double? latitude, [FromQuery] double? longitude)
        {
            try
            {
                var result = await _weatherService.GetDailyForecastAsync(latitude, longitude);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve daily forecast.", error = ex.Message });
            }
        }

        [HttpGet("air-quality")]
        public async Task<IActionResult> GetAirQuality([FromQuery] double? latitude, [FromQuery] double? longitude)
        {
            try
            {
                var result = await _weatherService.GetAirQualityAsync(latitude, longitude);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve air quality data.", error = ex.Message });
            }
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetWeatherSummary([FromQuery] double? latitude, [FromQuery] double? longitude)
        {
            try
            {
                var result = await _weatherService.GetWeatherSummaryAsync(latitude, longitude);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate weather summary.", error = ex.Message });
            }
        }

        [HttpGet("alerts")]
        public async Task<IActionResult> GetWeatherAlerts([FromQuery] double? latitude, [FromQuery] double? longitude)
        {
            try
            {
                var result = await _weatherService.GetWeatherAlertsAsync(latitude, longitude);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve weather alerts.", error = ex.Message });
            }
        }

        [HttpGet("automation-suggestions")]
        public async Task<IActionResult> GetAutomationSuggestions([FromQuery] double? latitude, [FromQuery] double? longitude)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _weatherService.GetAutomationSuggestionsAsync(userId, latitude, longitude);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate automation suggestions.", error = ex.Message });
            }
        }
    }
}
