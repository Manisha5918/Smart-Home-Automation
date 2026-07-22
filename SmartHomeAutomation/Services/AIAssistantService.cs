using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Text.Json;
using System.Text;

namespace SmartHomeAutomation.Services
{
    public class AIAssistantService
    {
        private readonly ApplicationDbContext _context;
        private readonly OllamaService _ollamaService;
        private readonly MemoryService _memoryService;
        private readonly IWeatherService _weatherService;
        private readonly IRealTimeNotificationService _notificationService;
        private const int MaxHistoryMessages = 20;

        public AIAssistantService(
            ApplicationDbContext context,
            OllamaService ollamaService,
            MemoryService memoryService,
            IWeatherService weatherService,
            IRealTimeNotificationService notificationService)
        {
            _context = context;
            _ollamaService = ollamaService;
            _memoryService = memoryService;
            _weatherService = weatherService;
            _notificationService = notificationService;
        }

        public async Task<string> ChatAsync(int userId, string message)
        {
            await _memoryService.SaveMessageAsync(userId, "User", message);
            var history = await _memoryService.GetConversationHistoryAsync(userId, MaxHistoryMessages);
            var context = await BuildContextAsync(userId);
            var intent = DetectIntent(message);
            var entities = ExtractEntities(message);
            var toolResult = await ExecuteToolCallAsync(intent, entities, userId);

            var systemPrompt = BuildSystemPrompt(history, context, toolResult, intent);
            using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
            var response = await _ollamaService.ChatAsync(systemPrompt, message, cts.Token);

            await _memoryService.SaveMessageAsync(userId, "Assistant", response);
            return response;
        }

        public async IAsyncEnumerable<string> StreamChatAsync(int userId, string message)
        {
            await _memoryService.SaveMessageAsync(userId, "User", message);
            var history = await _memoryService.GetConversationHistoryAsync(userId, MaxHistoryMessages);
            var context = await BuildContextAsync(userId);
            var intent = DetectIntent(message);
            var entities = ExtractEntities(message);
            var toolResult = await ExecuteToolCallAsync(intent, entities, userId);

            var systemPrompt = BuildSystemPrompt(history, context, toolResult, intent);
            var fullResponse = new StringBuilder();

            await foreach (var chunk in _ollamaService.StreamChatAsync(systemPrompt, message))
            {
                fullResponse.Append(chunk);
                yield return chunk;
            }

            await _memoryService.SaveMessageAsync(userId, "Assistant", fullResponse.ToString());
        }

        public async Task<CommandResult> ExecuteCommandAsync(int userId, string command)
        {
            var (intent, entities) = ParseCommand(command);
            return await ExecuteToolCallAsync(intent, entities, userId);
        }

        public async Task<string> GenerateReportAsync(int userId, string reportType)
        {
            var context = await BuildContextAsync(userId, includeAll: true);
            var history = await _memoryService.GetConversationHistoryAsync(userId, 5);

            var prompt = $"""
You are a smart home report generator. Generate a detailed {reportType} report based ONLY on the provided data.

Report Type: {reportType}

Previous Conversation:
{history}

Home Data:
{context}

Format the report with:
## Summary
Key findings and overview

## Insights
Detailed analysis of patterns and trends

## Issues
Problems detected that need attention

## Recommendations
Actionable suggestions to improve
""";

            var response = await _ollamaService.ChatAsync(prompt, $"Generate a {reportType} report for my smart home.");
            return response;
        }

        public async Task<string> BuildContextAsync(int userId, bool includeAll = false)
        {
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
            var rooms = await _context.Rooms.Where(r => r.UserId == userId).ToListAsync();
            var rules = await _context.AutomationRules.Where(r => r.Device != null && r.Device.UserId == userId).ToListAsync();
            var energyUsage = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId).OrderByDescending(e => e.RecordedAt).Take(20).ToListAsync();
            var alerts = await _context.DeviceAlerts.Where(a => a.Device != null && a.Device.UserId == userId && !a.IsRead).ToListAsync();
            var logs = await _context.ActivityLogs.Where(l => l.UserId == userId).OrderByDescending(l => l.CreatedAt).Take(30).ToListAsync();
            var notifications = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            var maintenance = await _context.MaintenanceSchedules.Where(m => m.Device != null && m.Device.UserId == userId).ToListAsync();
            var vacation = await _context.VacationModes.Where(v => v.UserId == userId).OrderByDescending(v => v.EndDate).FirstOrDefaultAsync();
            var energyGoals = await _context.EnergyGoals.Where(g => g.UserId == userId).ToListAsync();
            var failedLogins = await _context.LoginHistories.Where(l => l.Email != null && !l.IsSuccessful).OrderByDescending(l => l.AttemptedAt).Take(20).ToListAsync();
            var securityEvents = await _context.SecurityEvents.Where(s => s.UserId == userId).OrderByDescending(s => s.CreatedAt).Take(20).ToListAsync();

            var ctx = new
            {
                CurrentTime = DateTime.UtcNow,
                TotalDevices = devices.Count,
                ActiveDevices = devices.Count(d => d.Status == "On"),
                Devices = devices.Select(d => new { d.DeviceId, d.Name, d.Type, d.Location, d.Status, d.PowerConsumption, RoomName = d.Room?.RoomName ?? "Unknown" }),
                Rooms = rooms.Select(r => new { r.RoomId, r.RoomName }),
                AutomationRules = rules.Select(r => new { r.RuleId, r.RuleName, r.TriggerType, r.TriggerValue, r.Action, r.IsActive, DeviceName = r.Device?.Name ?? "Unknown" }),
                RecentEnergyUsage = includeAll ? energyUsage.Select(e => new { DeviceName = e.Device?.Name ?? "Unknown", e.PowerConsumption, e.RecordedAt }) : energyUsage.Take(20).Select(e => new { DeviceName = e.Device?.Name ?? "Unknown", e.PowerConsumption, e.RecordedAt }),
                ActiveAlerts = alerts.Select(a => new { a.AlertType, a.Message, DeviceName = a.Device?.Name ?? "Unknown" }),
                RecentActivityLogs = logs.Select(l => new { l.Action, DeviceName = l.Device?.Name ?? "System", l.Description, l.CreatedAt }),
                UnreadNotifications = notifications.Select(n => new { n.Title, n.Message }),
                MaintenanceSchedules = maintenance.Select(m => new { DeviceName = m.Device?.Name ?? "Unknown", m.NextServiceDate, m.Status }),
                VacationMode = vacation != null ? new { vacation.IsEnabled, vacation.StartDate, vacation.EndDate } : null,
                EnergyGoals = energyGoals.Select(g => new { g.MonthlyGoal }),
                FailedLogins = failedLogins.Count,
                SecurityEvents = securityEvents.Select(s => new { s.EventType, s.Description, s.CreatedAt }),
                DailyEnergyTotal = energyUsage.Where(e => e.RecordedAt.Date == DateTime.UtcNow.Date).Sum(e => e.PowerConsumption),
                MonthlyEnergyTotal = energyUsage.Where(e => e.RecordedAt.Month == DateTime.UtcNow.Month).Sum(e => e.PowerConsumption),
            };

            return JsonSerializer.Serialize(ctx, new JsonSerializerOptions { WriteIndented = true });
        }

        private string BuildSystemPrompt(string history, string context, CommandResult toolResult, string intent)
        {
            var toolResultText = toolResult != null
                ? $"\n\nTOOL EXECUTION RESULT:\nAction: {toolResult.Action}\nStatus: {toolResult.Status}\nMessage: {toolResult.Message}\nData: {toolResult.Data}"
                : "";

            return $"""
You are Smart Home AI, an intelligent home assistant. You have access to real smart home data.

PERSONALITY:
- Friendly, helpful, and concise
- Proactive — suggest actions without being asked
- Use natural language, not technical jargon
- When discussing numbers, provide context (e.g., "that's 15% higher than yesterday")

CAPABILITIES:
1. Answer questions about devices, energy, automation, security, weather, and activities
2. Execute commands (turn on/off devices, enable vacation mode, etc.)
3. Provide energy-saving recommendations
4. Detect unusual patterns and alert the user
5. Generate reports
6. Navigate the app

PREVIOUS CONVERSATION:
{history}

CURRENT HOME DATA:
{context}
{toolResultText}

User intent detected: {intent}

Rules:
- ONLY use data provided in CURRENT HOME DATA
- Never invent devices, values, or events
- If data is insufficient, say so clearly
- Keep responses concise (2-4 paragraphs max)
- Suggest specific actions the user can take
""";
        }

        private string DetectIntent(string message)
        {
            var lower = message.ToLowerInvariant();
            if (lower.Contains("energy") || lower.Contains("power") || lower.Contains("electric") || lower.Contains("consumption") || lower.Contains("bill") || lower.Contains("kwh")) return "energy_query";
            if (lower.Contains("device") || lower.Contains("appliance") || lower.Contains("light") || lower.Contains("fan") || lower.Contains("ac") || lower.Contains("tv") || lower.Contains("lock")) return "device_query";
            if (lower.Contains("turn on") || lower.Contains("turn off") || lower.Contains("switch")) return "device_command";
            if (lower.Contains("automation") || lower.Contains("rule") || lower.Contains("schedule")) return "automation_query";
            if (lower.Contains("security") || lower.Contains("alert") || lower.Contains("risk") || lower.Contains("intrusion")) return "security_query";
            if (lower.Contains("weather") || lower.Contains("temperature") || lower.Contains("rain") || lower.Contains("humidity")) return "weather_query";
            if (lower.Contains("report") || lower.Contains("summary")) return "report";
            if (lower.Contains("vacation") || lower.Contains("away") || lower.Contains("holiday")) return "vacation_query";
            if (lower.Contains("maintenance") || lower.Contains("health") || lower.Contains("repair") || lower.Contains("fault")) return "maintenance_query";
            if (lower.Contains("open") || lower.Contains("go to") || lower.Contains("navigate") || lower.Contains("show") || lower.Contains("display")) return "navigation";
            if (lower.Contains("notification") || lower.Contains("notify") || lower.Contains("alert") || lower.Contains("message")) return "notification_query";
            if (lower.Contains("routine") || lower.Contains("pattern") || lower.Contains("habit")) return "routine_query";
            if (lower.Contains("suggest") || lower.Contains("recommend") || lower.Contains("advice") || lower.Contains("optimize") || lower.Contains("tip")) return "recommendation";
            return "general";
        }

        private Dictionary<string, string> ExtractEntities(string message)
        {
            var entities = new Dictionary<string, string>();
            var lower = message.ToLowerInvariant();

            var roomPatterns = new[] { "living room", "bedroom", "kitchen", "dining room", "bathroom", "hall", "garage", "office", "study" };
            foreach (var room in roomPatterns)
            {
                if (lower.Contains(room))
                {
                    entities["room"] = room;
                    break;
                }
            }

            var deviceTypes = new[] { "light", "fan", "ac", "tv", "lock", "thermostat", "heater", "camera", "sensor", "plug", "speaker", "door" };
            foreach (var dt in deviceTypes)
            {
                if (lower.Contains(dt))
                {
                    entities["device_type"] = dt;
                    break;
                }
            }

            if (lower.Contains("turn on") || lower.Contains("switch on")) entities["action"] = "turn_on";
            else if (lower.Contains("turn off") || lower.Contains("switch off")) entities["action"] = "turn_off";
            else if (lower.Contains("enable") || lower.Contains("activate")) entities["action"] = "enable";
            else if (lower.Contains("disable") || lower.Contains("deactivate")) entities["action"] = "disable";
            else if (lower.Contains("lock")) entities["action"] = "lock";
            else if (lower.Contains("unlock")) entities["action"] = "unlock";

            if (lower.Contains("today")) entities["period"] = "today";
            else if (lower.Contains("yesterday")) entities["period"] = "yesterday";
            else if (lower.Contains("this week") || lower.Contains("weekly")) entities["period"] = "this_week";
            else if (lower.Contains("this month") || lower.Contains("monthly")) entities["period"] = "this_month";

            return entities;
        }

        private (string intent, Dictionary<string, string> entities) ParseCommand(string command)
        {
            return (DetectIntent(command), ExtractEntities(command));
        }

        private async Task<CommandResult> ExecuteToolCallAsync(string intent, Dictionary<string, string> entities, int userId)
        {
            try
            {
                return intent switch
                {
                    "device_command" => await ExecuteDeviceCommandAsync(entities, userId),
                    "navigation" => HandleNavigation(entities, command: null),
                    "energy_query" => await GetEnergyDataAsync(entities, userId),
                    "device_query" => await GetDeviceDataAsync(entities, userId),
                    "security_query" => await GetSecurityDataAsync(userId),
                    "weather_query" => await GetWeatherDataAsync(),
                    "notification_query" => await GetNotificationDataAsync(userId),
                    "maintenance_query" => await GetMaintenanceDataAsync(userId),
                    "automation_query" => await GetAutomationDataAsync(userId),
                    "vacation_query" => await GetVacationDataAsync(userId),
                    "routine_query" => await GetRoutineDataAsync(userId),
                    "recommendation" => await GetRecommendationsAsync(userId),
                    "report" => await GetReportDataAsync(userId),
                    _ => new CommandResult { Action = "general", Status = "success", Message = "General conversation", Data = "{}" }
                };
            }
            catch (Exception ex)
            {
                return new CommandResult { Action = intent, Status = "error", Message = ex.Message, Data = "{}" };
            }
        }

        private async Task<CommandResult> ExecuteDeviceCommandAsync(Dictionary<string, string> entities, int userId)
        {
            var deviceType = entities.GetValueOrDefault("device_type", "");
            var room = entities.GetValueOrDefault("room", "");
            var action = entities.GetValueOrDefault("action", "");

            var query = _context.Devices.Where(d => d.UserId == userId);
            if (!string.IsNullOrEmpty(deviceType))
                query = query.Where(d => d.Type.ToLower().Contains(deviceType));
            if (!string.IsNullOrEmpty(room))
                query = query.Where(d => d.Room != null && d.Room.RoomName.ToLower().Contains(room));

            var device = await query.FirstOrDefaultAsync();
            if (device == null)
            {
                var availableDevices = await _context.Devices.Where(d => d.UserId == userId).Select(d => d.Name).ToListAsync();
                return new CommandResult { Action = "device_command", Status = "error", Message = $"Device not found. Available devices: {string.Join(", ", availableDevices)}", Data = "{}" };
            }

            var newStatus = action switch
            {
                "turn_on" => "On",
                "turn_off" => "Off",
                _ => device.Status == "On" ? "Off" : "On"
            };

            device.Status = newStatus;
            await _context.SaveChangesAsync();

            var activityLog = new Models.ActivityLog
            {
                UserId = userId,
                DeviceId = device.DeviceId,
                Action = "Device Status Changed",
                Description = $"{device.Name} automatically changed to {newStatus}.",
                DeviceStatus = newStatus,
                CreatedAt = DateTime.UtcNow
            };
            _context.ActivityLogs.Add(activityLog);
            await _context.SaveChangesAsync();

            await _notificationService.NotifyDeviceStatusChangedAsync(userId, new { deviceId = device.DeviceId, name = device.Name, status = newStatus });
            await _notificationService.NotifyDashboardUpdateAsync(userId, new { deviceId = device.DeviceId, name = device.Name, status = newStatus });

            return new CommandResult
            {
                Action = "device_command",
                Status = "success",
                Message = $"{device.Name} ({device.Type}) has been turned {newStatus.ToLower()}.",
                Data = JsonSerializer.Serialize(new { deviceId = device.DeviceId, name = device.Name, status = newStatus })
            };
        }

        private CommandResult HandleNavigation(Dictionary<string, string> entities, string command)
        {
            var lower = (command ?? "").ToLowerInvariant();
            var path = "";

            if (lower.Contains("dashboard") || lower.Contains("home")) path = "/";
            else if (lower.Contains("device")) path = "/devices";
            else if (lower.Contains("room")) path = "/rooms";
            else if (lower.Contains("notification")) path = "/notifications";
            else if (lower.Contains("activity") || lower.Contains("log")) path = "/activity-logs";
            else if (lower.Contains("automation") || lower.Contains("rule")) path = "/automation-rules";
            else if (lower.Contains("energy") || lower.Contains("report")) path = "/ai-report";
            else if (lower.Contains("suggestion") || lower.Contains("recommend")) path = "/ai-suggestions";
            else if (lower.Contains("insight") || lower.Contains("explain")) path = "/smart-insights";
            else if (lower.Contains("chat") || lower.Contains("assistant")) path = "/ai-chat";
            else if (lower.Contains("vacation") || lower.Contains("mode")) path = "/vacation-mode";
            else if (lower.Contains("security") || lower.Contains("alert")) path = "/security";
            else if (lower.Contains("weather")) path = "/weather";
            else if (lower.Contains("maintenance") || lower.Contains("predict")) path = "/predictive-maintenance";
            else if (lower.Contains("profile") || lower.Contains("account")) path = "/profile";
            else if (lower.Contains("admin")) path = "/admin/dashboard";

            if (string.IsNullOrEmpty(path))
                return new CommandResult { Action = "navigation", Status = "error", Message = "Unknown navigation destination.", Data = "{}" };

            return new CommandResult { Action = "navigation", Status = "success", Message = $"Navigating to {path}.", Data = JsonSerializer.Serialize(new { path }) };
        }

        private async Task<CommandResult> GetEnergyDataAsync(Dictionary<string, string> entities, int userId)
        {
            var period = entities.GetValueOrDefault("period", "today");
            var now = DateTime.UtcNow;
            DateTime startDate = period switch
            {
                "yesterday" => now.Date.AddDays(-1),
                "this_week" => now.Date.AddDays(-(int)now.DayOfWeek),
                "this_month" => new DateTime(now.Year, now.Month, 1),
                _ => now.Date
            };

            var energyData = await _context.EnergyUsages
                .Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= startDate)
                .GroupBy(e => e.Device!.Name)
                .Select(g => new { DeviceName = g.Key, TotalConsumption = g.Sum(e => e.PowerConsumption), AverageConsumption = g.Average(e => e.PowerConsumption), Readings = g.Count() })
                .OrderByDescending(x => x.TotalConsumption)
                .ToListAsync();

            var totalConsumption = energyData.Sum(e => e.TotalConsumption);
            var highestDevice = energyData.FirstOrDefault();

            return new CommandResult
            {
                Action = "energy_query",
                Status = "success",
                Message = $"Energy data for {period}: Total {totalConsumption:F2} Wh across {energyData.Count} devices.",
                Data = JsonSerializer.Serialize(new { period, totalConsumption, deviceCount = energyData.Count, devices = energyData, highestConsumer = highestDevice })
            };
        }

        private async Task<CommandResult> GetDeviceDataAsync(Dictionary<string, string> entities, int userId)
        {
            var deviceType = entities.GetValueOrDefault("device_type", "");
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();

            if (!string.IsNullOrEmpty(deviceType))
                devices = devices.Where(d => d.Type.ToLower().Contains(deviceType)).ToList();

            return new CommandResult
            {
                Action = "device_query",
                Status = "success",
                Message = $"Found {devices.Count} devices. {devices.Count(d => d.Status == "On")} are active.",
                Data = JsonSerializer.Serialize(new { totalDevices = devices.Count, activeDevices = devices.Count(d => d.Status == "On"), devices = devices.Select(d => new { d.DeviceId, d.Name, d.Type, d.Status, d.PowerConsumption, d.Location }) })
            };
        }

        private async Task<CommandResult> GetSecurityDataAsync(int userId)
        {
            var failedLogins = await _context.LoginHistories.Where(l => l.Email != null && !l.IsSuccessful).OrderByDescending(l => l.AttemptedAt).Take(20).ToListAsync();
            var securityEvents = await _context.SecurityEvents.Where(s => s.UserId == userId).OrderByDescending(s => s.CreatedAt).Take(20).ToListAsync();
            var alerts = await _context.DeviceAlerts.Where(a => a.Device != null && a.Device.UserId == userId && !a.IsRead).ToListAsync();

            return new CommandResult
            {
                Action = "security_query",
                Status = "success",
                Message = $"Security status: {alerts.Count} active alerts, {failedLogins.Count} recent failed logins, {securityEvents.Count} security events.",
                Data = JsonSerializer.Serialize(new { activeAlerts = alerts.Count, failedLogins = failedLogins.Count, securityEvents = securityEvents.Count, alerts, failedLoginList = failedLogins.Take(10), events = securityEvents.Take(10) })
            };
        }

        private async Task<CommandResult> GetWeatherDataAsync()
        {
            try
            {
                var weather = await _weatherService.GetCurrentWeatherAsync();
                return new CommandResult
                {
                    Action = "weather_query",
                    Status = "success",
                    Message = $"Current weather: {weather.Temperature}°C, {weather.WeatherCondition}, Humidity: {weather.Humidity}%",
                    Data = JsonSerializer.Serialize(weather)
                };
            }
            catch
            {
                return new CommandResult { Action = "weather_query", Status = "error", Message = "Weather data temporarily unavailable.", Data = "{}" };
            }
        }

        private async Task<CommandResult> GetNotificationDataAsync(int userId)
        {
            var notifications = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).OrderByDescending(n => n.CreatedAt).Take(10).ToListAsync();
            return new CommandResult
            {
                Action = "notification_query",
                Status = "success",
                Message = $"You have {notifications.Count} unread notifications.",
                Data = JsonSerializer.Serialize(new { count = notifications.Count, notifications })
            };
        }

        private async Task<CommandResult> GetMaintenanceDataAsync(int userId)
        {
            var maintenance = await _context.MaintenanceSchedules
                .Where(m => m.Device != null && m.Device.UserId == userId)
                .OrderBy(m => m.NextServiceDate)
                .ToListAsync();

            var overdue = maintenance.Where(m => m.NextServiceDate < DateTime.UtcNow).ToList();
            var pending = maintenance.Where(m => m.NextServiceDate >= DateTime.UtcNow).ToList();

            return new CommandResult
            {
                Action = "maintenance_query",
                Status = "success",
                Message = $"Maintenance: {overdue.Count} overdue, {pending.Count} upcoming.",
                Data = JsonSerializer.Serialize(new { total = maintenance.Count, overdue = overdue.Count, pending = pending.Count, items = maintenance.Select(m => new { DeviceName = m.Device?.Name ?? "Unknown", m.NextServiceDate, m.Status }) })
            };
        }

        private async Task<CommandResult> GetAutomationDataAsync(int userId)
        {
            var rules = await _context.AutomationRules.Where(r => r.Device != null && r.Device.UserId == userId).ToListAsync();
            var activeRules = rules.Where(r => r.IsActive).ToList();

            return new CommandResult
            {
                Action = "automation_query",
                Status = "success",
                Message = $"You have {rules.Count} automation rules ({activeRules.Count} active).",
                Data = JsonSerializer.Serialize(new { total = rules.Count, active = activeRules.Count, rules = rules.Select(r => new { r.RuleId, r.RuleName, r.IsActive, r.TriggerType, r.Action, DeviceName = r.Device?.Name ?? "Unknown" }) })
            };
        }

        private async Task<CommandResult> GetVacationDataAsync(int userId)
        {
            var vacation = await _context.VacationModes.Where(v => v.UserId == userId).OrderByDescending(v => v.EndDate).FirstOrDefaultAsync();
            if (vacation == null)
                return new CommandResult { Action = "vacation_query", Status = "success", Message = "Vacation mode is not set up.", Data = "{}" };

            return new CommandResult
            {
                Action = "vacation_query",
                Status = "success",
                Message = vacation.IsEnabled ? $"Vacation mode is ON. Started {vacation.StartDate:MMM dd}, ends {vacation.EndDate:MMM dd}." : "Vacation mode is OFF.",
                Data = JsonSerializer.Serialize(new { vacation.IsEnabled, vacation.StartDate, vacation.EndDate })
            };
        }

        private async Task<CommandResult> GetRoutineDataAsync(int userId)
        {
            var logs = await _context.ActivityLogs
                .Where(l => l.UserId == userId && l.DeviceId != null)
                .GroupBy(l => new { l.DeviceId, l.Action, Hour = l.CreatedAt.Hour })
                .Select(g => new { DeviceId = g.Key.DeviceId, Action = g.Key.Action, Hour = g.Key.Hour, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(20)
                .ToListAsync();

            return new CommandResult
            {
                Action = "routine_query",
                Status = "success",
                Message = $"Detected {logs.Count} patterns in your device usage.",
                Data = JsonSerializer.Serialize(new { patterns = logs })
            };
        }

        private async Task<CommandResult> GetRecommendationsAsync(int userId)
        {
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
            var energyUsage = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId).OrderByDescending(e => e.RecordedAt).Take(50).ToListAsync();
            var rules = await _context.AutomationRules.Where(r => r.Device != null && r.Device.UserId == userId).ToListAsync();
            var maintenance = await _context.MaintenanceSchedules.Where(m => m.Device != null && m.Device.UserId == userId).ToListAsync();

            var recommendations = new List<string>();
            var onDevices = devices.Where(d => d.Status == "On").ToList();
            if (onDevices.Count > devices.Count * 0.7)
                recommendations.Add($"{onDevices.Count} of {devices.Count} devices are on. Consider turning off unused devices to save energy.");

            var avgConsumption = energyUsage.Any() ? energyUsage.Average(e => e.PowerConsumption) : 0;
            var highConsumers = devices.Where(d => d.PowerConsumption > avgConsumption * 1.5 && d.Status == "On").ToList();
            foreach (var device in highConsumers.Take(3))
                recommendations.Add($"{device.Name} is consuming {device.PowerConsumption}W — significantly above average. Consider checking for issues.");

            var overdueMaint = maintenance.Where(m => m.NextServiceDate < DateTime.UtcNow).ToList();
            foreach (var m in overdueMaint.Take(3))
                recommendations.Add($"Maintenance overdue for {m.Device?.Name ?? "Unknown"} (due {m.NextServiceDate:MMM dd}). Schedule service soon.");

            if (!rules.Any())
                recommendations.Add("No automation rules set up. Create rules to automate your home and save energy.");

            return new CommandResult
            {
                Action = "recommendation",
                Status = "success",
                Message = $"Generated {recommendations.Count} recommendations.",
                Data = JsonSerializer.Serialize(new { count = recommendations.Count, recommendations })
            };
        }

        private async Task<CommandResult> GetReportDataAsync(int userId)
        {
            var now = DateTime.UtcNow;
            var todayEnergy = await _context.EnergyUsages
                .Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt.Date == now.Date)
                .SumAsync(e => e.PowerConsumption);
            var weekEnergy = await _context.EnergyUsages
                .Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= now.Date.AddDays(-7))
                .SumAsync(e => e.PowerConsumption);
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
            var alerts = await _context.DeviceAlerts.Where(a => a.Device != null && a.Device.UserId == userId && !a.IsRead).CountAsync();
            var logs = await _context.ActivityLogs.Where(l => l.UserId == userId).CountAsync();

            return new CommandResult
            {
                Action = "report",
                Status = "success",
                Message = $"Quick summary: {devices.Count} devices, {todayEnergy:F1} Wh today, {weekEnergy:F1} Wh this week, {alerts} active alerts.",
                Data = JsonSerializer.Serialize(new { devices = devices.Count, activeDevices = devices.Count(d => d.Status == "On"), todayEnergy, weekEnergy, alerts, totalActivities = logs })
            };
        }
    }

    public class CommandResult
    {
        public string Action { get; set; } = "";
        public string Status { get; set; } = "";
        public string Message { get; set; } = "";
        public string Data { get; set; } = "{}";
    }
}
