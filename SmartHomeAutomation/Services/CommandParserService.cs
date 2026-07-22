using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using System.Text.Json;

namespace SmartHomeAutomation.Services
{
    public class CommandParserService
    {
        private readonly OllamaService _ollamaService;
        private readonly ApplicationDbContext _context;
        private readonly AutomationRuleService _automationRuleService;

        public CommandParserService(
            OllamaService ollamaService,
            ApplicationDbContext context,
            AutomationRuleService automationRuleService)
        {
            _ollamaService = ollamaService;
            _context = context;
            _automationRuleService = automationRuleService;
        }

        public async Task<VoiceResponseDto> ProcessCommandAsync(int userId, string voiceText)
        {
            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.Name,
                    d.Type,
                    d.Status,
                    RoomName = d.Room != null ? d.Room.RoomName : "General"
                })
                .ToListAsync();

            var rooms = await _context.Rooms
                .Select(r => r.RoomName)
                .ToListAsync();

            var deviceList = string.Join("\n", devices.Select(d =>
                $"  - \"{d.Name}\" ({d.Type}, currently {d.Status}, in {d.RoomName})"));

            var roomList = string.Join(", ", rooms.Select(r => $"\"{r}\""));

            var navigationPages = "/, /devices, /rooms, /notifications, /activity-logs, /automation-rules, /ai-suggestions, /ai-chat, /profile, /vacation-mode, /maintenance, /ai-report, /admin";

            var prompt = BuildPrompt(deviceList, roomList, navigationPages);
            var response = await _ollamaService.ChatAsync(prompt, voiceText);
            var parsed = ParseJson(response);

            if (parsed == null)
            {
                return new VoiceResponseDto
                {
                    Success = false,
                    Action = "unknown",
                    SpokenResponse = "I'm sorry, I didn't understand that command."
                };
            }

            var action = parsed.Value.TryGetProperty("action", out var actionProp) ? actionProp.GetString() ?? "unknown" : "unknown";
            var hasParams = parsed.Value.TryGetProperty("parameters", out var parameters);
            if (!hasParams) parameters = JsonDocument.Parse("{}").RootElement;

            switch (action)
            {
                case "toggleDevice":
                    return await HandleToggleDevice(userId, parameters);
                case "navigate":
                    return HandleNavigate(parameters);
                case "query":
                    string queryResponse = "I'm not sure how to answer that question.";
                    if (parameters.ValueKind == JsonValueKind.Object)
                    {
                        var target = parameters.TryGetProperty("target", out var targetProp) ? targetProp.GetString()?.ToLower() ?? "" : "";
                        var deviceName = parameters.TryGetProperty("deviceName", out var dn) ? dn.GetString() : "";

                        if (target.Contains("power") || target.Contains("energy") || target.Contains("consumption"))
                        {
                            var activeDevices = await _context.Devices.Where(d => d.UserId == userId && d.Status == "On").ToListAsync();
                            var totalPower = activeDevices.Sum(d => d.PowerConsumption);
                            queryResponse = $"Your total power consumption is currently {totalPower:F2} W from {activeDevices.Count} active devices.";
                        }
                        else if (!string.IsNullOrEmpty(deviceName) || target.Contains("status") || target.Contains("device"))
                        {
                            var searchName = string.IsNullOrEmpty(deviceName) ? target : deviceName;
                            var device = await _context.Devices
                                .Where(d => d.UserId == userId)
                                .FirstOrDefaultAsync(d => d.Name.ToLower().Contains(searchName.ToLower()) || searchName.ToLower().Contains(d.Name.ToLower()));

                            if (device != null)
                            {
                                queryResponse = $"{device.Name} is successfully turned {device.Status.ToLower()}.";
                                if (device.Type.Equals("Lock", StringComparison.OrdinalIgnoreCase))
                                {
                                    queryResponse = device.Status.Equals("On", StringComparison.OrdinalIgnoreCase) ? "Door locked." : "Door unlocked.";
                                }
                            }
                            else if (!string.IsNullOrEmpty(deviceName))
                            {
                                queryResponse = $"I couldn't find a device named {deviceName}.";
                            }
                        }
                    }
                    return new VoiceResponseDto
                    {
                        Success = true,
                        Action = "query",
                        SpokenResponse = queryResponse
                    };
                default:
                    return new VoiceResponseDto
                    {
                        Success = false,
                        Action = "unknown",
                        SpokenResponse = "I'm sorry, I didn't understand that command."
                    };
            }
        }

        private static string BuildPrompt(string deviceList, string roomList, string navigationPages)
        {
            var format = """{"action":"...","parameters":{...},"confidence":0.0}""";

            return $"""
                SYSTEM: You are an AI Smart Home Intent Parser.
                Understand the user's natural language request.
                Match the closest available device using the provided device list.
                Infer intent naturally.
                Return ONLY valid JSON.
                Never explain.
                Never use markdown.
                Never wrap JSON in code blocks.

                JSON schema:
                {format}

                Supported actions:
                - toggleDevice: Turn a device on/off. Parameters: deviceName (exact name from device list), targetStatus ("On" or "Off")
                - navigate: Go to a navigation page. Parameters: path (one of the available pages)
                - query: Retrieve status or information. Parameters: target ("power" or "status"), deviceName (optional)
                - unknown: If command is not supported.

                DEVICES:
                {deviceList}

                ROOMS:
                {roomList}

                PAGES:
                {navigationPages}
                """;
        }

        private static JsonElement? ParseJson(string response)
        {
            try
            {
                var start = response.IndexOf('{');
                var end = response.LastIndexOf('}');
                if (start >= 0 && end > start)
                {
                    return JsonDocument.Parse(response.Substring(start, end - start + 1)).RootElement;
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        private async Task<VoiceResponseDto> HandleToggleDevice(int userId, JsonElement parameters)
        {
            var deviceName = parameters.TryGetProperty("deviceName", out var dn)
                ? dn.GetString() ?? "" : "";

            var targetStatus = parameters.TryGetProperty("targetStatus", out var ts)
                ? ts.GetString() ?? "" : "";

            if (string.IsNullOrWhiteSpace(deviceName))
            {
                return new VoiceResponseDto
                {
                    Success = false,
                    Action = "toggleDevice",
                    SpokenResponse = "Which device would you like to control?"
                };
            }

            var device = await _context.Devices
                .Where(d => d.UserId == userId)
                .FirstOrDefaultAsync(d =>
                    d.Name.Equals(deviceName, StringComparison.OrdinalIgnoreCase) ||
                    d.Name.Contains(deviceName, StringComparison.OrdinalIgnoreCase) ||
                    deviceName.Contains(d.Name, StringComparison.OrdinalIgnoreCase));

            if (device == null)
            {
                return new VoiceResponseDto
                {
                    Success = false,
                    Action = "toggleDevice",
                    SpokenResponse = $"I couldn't find a device named \"{deviceName}\"."
                };
            }

            if (!string.Equals(targetStatus, "On", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(targetStatus, "Off", StringComparison.OrdinalIgnoreCase))
            {
                targetStatus = device.Status == "On" ? "Off" : "On";
            }

            device.Status = targetStatus;
            _context.Devices.Update(device);

            _context.ActivityLogs.Add(new Models.ActivityLog
            {
                UserId = userId,
                DeviceId = device.DeviceId,
                Action = "Device Status Changed",
                DeviceStatus = targetStatus,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            try { await _automationRuleService.EvaluateRulesAsync(device); } catch { }

            string stateWord = targetStatus.Equals("On", StringComparison.OrdinalIgnoreCase) ? "on" : "off";
            string spoken = $"Device successfully turned {stateWord}.";
            if (device.Type.Equals("Lock", StringComparison.OrdinalIgnoreCase) || device.Name.ToLower().Contains("lock") || device.Name.ToLower().Contains("door"))
            {
                spoken = targetStatus.Equals("On", StringComparison.OrdinalIgnoreCase) ? "Door locked." : "Door unlocked.";
            }

            return new VoiceResponseDto
            {
                Success = true,
                Action = "toggleDevice",
                SpokenResponse = spoken,
                Data = new { deviceId = device.DeviceId, deviceName = device.Name, status = targetStatus }
            };
        }

        private static VoiceResponseDto HandleNavigate(JsonElement parameters)
        {
            var path = parameters.TryGetProperty("path", out var p) ? p.GetString() ?? "/" : "/";

            return new VoiceResponseDto
            {
                Success = true,
                Action = "navigate",
                SpokenResponse = "Navigation completed.",
                Data = new { path }
            };
        }
    }
}
