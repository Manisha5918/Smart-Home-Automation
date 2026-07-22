using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Text.Json;

namespace SmartHomeAutomation.Services
{
    public class AIExplainabilityService
    {
        private readonly ApplicationDbContext _context;
        private readonly OllamaService _ollamaService;
        private readonly MemoryService _memoryService;
        private readonly IWeatherService _weatherService;

        public AIExplainabilityService(
            ApplicationDbContext context,
            OllamaService ollamaService,
            MemoryService memoryService,
            IWeatherService weatherService)
        {
            _context = context;
            _ollamaService = ollamaService;
            _memoryService = memoryService;
            _weatherService = weatherService;
        }

        private static bool IsWeatherRelated(string message)
        {
            if (string.IsNullOrWhiteSpace(message)) return false;
            var lower = message.ToLowerInvariant();
            string[] keywords = {
                "weather", "temp", "temperature", "forecast", "rain", "humidity", "wind", "uv", "sunset", "sunrise",
                "outdoor", "outside", "sun", "hot", "cold", "curtain", "window", "ac", "air condition", "climate"
            };
            return keywords.Any(k => lower.Contains(k));
        }

        public async Task<string> ExplainAsync(int userId, string question)
        {
            await _memoryService.SaveMessageAsync(userId, "Explain_User", question);

            var now = DateTime.UtcNow;

            var recentMessages = await _context.ConversationMemories
                .Where(m => m.UserId == userId && (m.Role == "Explain_User" || m.Role == "Explain_Assistant"))
                .OrderByDescending(m => m.CreatedAt)
                .Take(6)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            var rooms = await _context.Rooms
                .Where(r => r.UserId == userId)
                .Select(r => new { r.RoomId, Name = r.RoomName, r.Description })
                .ToListAsync();

            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.DeviceId, d.Name, d.Type, d.Status, d.PowerConsumption,
                    RoomName = d.Room != null ? d.Room.RoomName : "Unknown"
                })
                .ToListAsync();

            var rules = await _context.AutomationRules
                .Where(r => r.Device != null && r.Device.UserId == userId)
                .Select(r => new
                {
                    r.RuleId, r.RuleName, r.TriggerType, r.TriggerValue, r.Action, r.IsActive,
                    DeviceName = r.Device != null ? r.Device.Name : "Unknown"
                })
                .ToListAsync();

            var logs = await _context.ActivityLogs
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(30)
                .Select(l => new
                {
                    l.Action,
                    DeviceName = l.Device != null ? l.Device.Name : "System",
                    l.DeviceStatus, l.Description, l.CreatedAt
                })
                .ToListAsync();

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .Select(n => new { n.Title, n.Message, n.CreatedAt, n.IsRead })
                .ToListAsync();

            var alerts = await _context.DeviceAlerts
                .Where(a => a.Device != null && a.Device.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(15)
                .Select(a => new { a.AlertType, a.Message, a.CreatedAt, DeviceName = a.Device != null ? a.Device.Name : "Unknown", a.IsRead })
                .ToListAsync();

            var maintenance = await _context.MaintenanceSchedules
                .Where(m => m.Device != null && m.Device.UserId == userId)
                .Select(m => new { DeviceName = m.Device != null ? m.Device.Name : "Unknown", m.NextServiceDate, m.Status })
                .ToListAsync();

            var vacationMode = await _context.VacationModes
                .Where(v => v.UserId == userId)
                .OrderByDescending(v => v.StartDate)
                .Select(v => new { v.IsEnabled, v.StartDate, v.EndDate })
                .FirstOrDefaultAsync();

            var energyGoals = await _context.EnergyGoals
                .Where(g => g.UserId == userId)
                .Select(g => new { g.MonthlyGoal, g.CreatedAt })
                .ToListAsync();

            var energyUsage = await _context.EnergyUsages
                .Where(e => e.Device != null && e.Device.UserId == userId)
                .OrderByDescending(e => e.RecordedAt)
                .Take(35)
                .Select(e => new { DeviceName = e.Device != null ? e.Device.Name : "Unknown", e.PowerConsumption, e.RecordedAt })
                .ToListAsync();

            var activeAlertsCount = await _context.DeviceAlerts
                .CountAsync(a => a.Device != null && a.Device.UserId == userId && !a.IsRead);

            var activeCriticalTasksCount = await _context.MaintenanceSchedules
                .CountAsync(m => m.Device != null && m.Device.UserId == userId && m.Status == "Pending");

            var conversationHistory = string.Join("\n", recentMessages.Select(m =>
                $"{(m.Role == "Explain_User" ? "User" : "Assistant")}: {m.Message}"));

            var homeHealthScore = Math.Max(10, 100 - (activeAlertsCount * 10) - (activeCriticalTasksCount * 5));

            var homeContext = new
            {
                CurrentTime = now,
                HomeHealthScore = homeHealthScore,
                Rooms = rooms,
                Devices = devices,
                AutomationRules = rules,
                RecentActivityLogs = logs,
                RecentNotifications = notifications,
                RecentAlerts = alerts,
                MaintenanceSchedules = maintenance,
                VacationMode = vacationMode,
                EnergyGoals = energyGoals,
                RecentEnergyUsage = energyUsage
            };

            var factualContextJson = JsonSerializer.Serialize(homeContext, new JsonSerializerOptions { WriteIndented = true });

            string weatherContext = "";
            if (IsWeatherRelated(question))
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
                catch
                {
                    // weather unavailable, skip
                }
            }

            var systemPrompt = $$"""
                You are the premium AI Smart Home Explainability Engine, an advanced smart home analyst.
                Your job is to answer the user's question using ONLY the provided facts.

                RULES:
                1. Only use facts present in the CURRENT HOME STATUS JSON.
                2. Do not fabricate, assume, or make up any values, devices, rooms, or events.
                3. If the facts are insufficient to answer the question, clearly state: "I cannot determine this from the current smart home data."
                4. Answer concisely, directly, and naturally.
                5. Highlight specific devices, rooms, or actions involved.
                6. Avoid technical prompt jargon. Speak to the user as a helpful smart assistant.

                PREVIOUS CONVERSATION HISTORY:
                {{conversationHistory}}

                CURRENT HOME STATUS:
                {{factualContextJson}}{{weatherContext}}
                """;

            string explanation;
            try
            {
                explanation = await _ollamaService.ChatAsync(systemPrompt, question);
            }
            catch (Exception ex)
            {
                explanation = $"I'm sorry, the AI service is currently unavailable. Please try again later. ({ex.Message})";
            }

            await _memoryService.SaveMessageAsync(userId, "Explain_Assistant", explanation);
            return explanation;
        }

        public async Task ClearExplanationHistoryAsync(int userId)
        {
            var memories = await _context.ConversationMemories
                .Where(m => m.UserId == userId && (m.Role == "Explain_User" || m.Role == "Explain_Assistant"))
                .ToListAsync();

            _context.ConversationMemories.RemoveRange(memories);
            await _context.SaveChangesAsync();
        }
    }
}
