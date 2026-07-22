using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Services;
using System.Security.Claims;
using System.Linq;


namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly OllamaService _ollamaService;

        private readonly HomeIntelligenceService
            _homeIntelligenceService;

        private readonly RoutineLearningService
            _routineLearningService;

        private readonly MemoryService _memoryService;
        private readonly IWeatherService _weatherService;

        public AIController(
          OllamaService ollamaService,
          HomeIntelligenceService homeIntelligenceService,
          RoutineLearningService routineLearningService,
          MemoryService memoryService,
          IWeatherService weatherService)
        {
            _ollamaService = ollamaService;

            _homeIntelligenceService =
                homeIntelligenceService;

            _routineLearningService =
                routineLearningService;

            _memoryService = memoryService;
            _weatherService = weatherService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }

        private bool IsWeatherRelated(string message)
        {
            if (string.IsNullOrWhiteSpace(message)) return false;
            var lower = message.ToLowerInvariant();
            string[] keywords = { 
                "weather", "temp", "temperature", "forecast", "rain", "humidity", "wind", "uv", "sunset", "sunrise",
                "outdoor", "outside", "sun", "hot", "cold", "curtain", "window", "ac", "air condition", "climate"
            };
            return keywords.Any(k => lower.Contains(k));
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat(
            AIChatDto chatDto)
        {
            if (string.IsNullOrWhiteSpace(
                chatDto.Message))
            {
                return BadRequest(new
                {
                    message = "Message is required."
                });
            }

            var userId = GetCurrentUserId();

            await _memoryService.SaveMessageAsync(
    userId,
    "User",
    chatDto.Message);

            var conversationHistory =
    await _memoryService.GetConversationHistoryAsync(userId);

            var homeContext =
                await _homeIntelligenceService
                    .BuildHomeContextAsync(userId);

            string weatherContext = "";
            if (IsWeatherRelated(chatDto.Message))
            {
                try
                {
                    var weather = await _weatherService.GetCurrentWeatherAsync();
                    weatherContext = $"\n\nCURRENT OUTDOOR WEATHER:\n" +
                                     $"- Temperature: {weather.Temperature}°C\n" +
                                     $"- Feels Like: {weather.FeelsLike}°C\n" +
                                     $"- Humidity: {weather.Humidity}%\n" +
                                     $"- Weather Condition: {weather.WeatherCondition}\n" +
                                     $"- Wind Speed: {weather.WindSpeed} km/h\n" +
                                     $"- Wind Direction: {weather.WindDirection}°\n" +
                                     $"- Wind Gust: {weather.WindGust} km/h\n" +
                                     $"- Pressure: {weather.Pressure} hPa\n" +
                                     $"- UV Index: {weather.UvIndex}\n" +
                                     $"- Cloud Cover: {weather.CloudCover}%\n" +
                                     $"- Sunrise: {weather.Sunrise:yyyy-MM-dd HH:mm:ss}\n" +
                                     $"- Sunset: {weather.Sunset:yyyy-MM-dd HH:mm:ss}\n" +
                                     $"- Rain Probability: {weather.RainProbability}%\n" +
                                     $"- Rain Amount: {weather.RainAmount} mm\n" +
                                     $"- Last Updated: {weather.LastUpdated:yyyy-MM-dd HH:mm:ss}";
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to fetch current weather for AI prompt: {ex.Message}");
                }
            }

            var systemPrompt = $$"""
                You are Smart Home AI, a smart home
                intelligence assistant.

                Your job is to analyze the user's
                actual smart home data.

                Rules:

                1. Only make claims supported by the
                   provided home data.

                2. Never invent devices, energy values,
                   alerts, maintenance information or
                   routines.

                3. If the available data is insufficient,
                   clearly say that there is not enough data.

                4. Give concise and practical answers.

                5. When discussing energy usage, identify
                   the relevant device and explain the
                   evidence from the provided data.

                6. PowerConsumptionWatts values are
                   measured in watts (W).

                7. DetectedRoutines are calculated by the
                   smart home routine detection system.
                   Explain these patterns naturally.

                8. You currently cannot directly control
                   devices. Never claim that you turned a
                   device on or off.

                PREVIOUS CONVERSATION

                {conversationHistory}

                CURRENT HOME DATA

                {homeContext}{weatherContext}
                """;

            try
            {
                var aiResponse =
                    await _ollamaService.ChatAsync(
                        systemPrompt,
                        chatDto.Message);

                await _memoryService.SaveMessageAsync(
    userId,
    "Assistant",
    aiResponse);

                return Ok(new
                {
                    response = aiResponse
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new
                {
                    message =
                        "Home AI service is currently unavailable.",

                    error = ex.Message
                });
            }
        }

        [HttpGet("routines")]
        public async Task<IActionResult> GetDetectedRoutines()
        {
            var userId = GetCurrentUserId();

            var routines =
                await _routineLearningService
                    .DetectRoutinesAsync(userId);

            return Ok(new
            {
                detectedAt = DateTime.Now,

                totalRoutines = routines.Count,

                routines
            });
        }
    }
}