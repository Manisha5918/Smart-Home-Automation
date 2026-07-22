using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Models;
using System.Text;

namespace SmartHomeAutomation.Services
{
    public class MonthlyReportService
    {
        private readonly ApplicationDbContext _context;
        private readonly OllamaService _ollamaService;

        public MonthlyReportService(ApplicationDbContext context, OllamaService ollamaService)
        {
            _context = context;
            _ollamaService = ollamaService;
        }

        public async Task<MonthlyReportDto> GetMonthlyReportAsync(int userId)
        {
            var now = DateTime.Now;
            var startDate = new DateTime(now.Year, now.Month, 1);
            var monthName = now.ToString("MMMM yyyy");

            // 1. Fetch real energy usage records for this user for the current month
            var usages = await _context.EnergyUsages
                .Include(e => e.Device)
                .Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= startDate)
                .ToListAsync();

            // Calculate total power consumed in Wh/W, then convert to kWh
            double totalPower = usages.Sum(e => e.PowerConsumption);
            double energyUsed = Math.Round(totalPower / 1000.0, 2);

            // Calculate estimated bill using standard tariff (₹8 per kWh)
            double electricityBill = Math.Round(energyUsed * 8.0, 2);

            // Calculate CO2 saved: 0.5 kg CO2 saved per kWh * 15% smart efficiency savings
            // EnergySaved = energyUsed * (0.15 / (1.0 - 0.15)) = energyUsed * 0.17647
            double energySaved = energyUsed * 0.17647;
            double co2Saved = Math.Round(energySaved * 0.5, 2);

            // Calculate most used device (by device total recorded consumption)
            var mostUsed = usages
                .GroupBy(e => new { e.DeviceId, e.Device!.Name })
                .Select(g => new
                {
                    DeviceName = g.Key.Name,
                    Consumption = g.Sum(x => x.PowerConsumption)
                })
                .OrderByDescending(x => x.Consumption)
                .FirstOrDefault();

            string mostUsedDeviceName = mostUsed?.DeviceName ?? "No usage data";
            double mostUsedDeviceConsumption = Math.Round(mostUsed?.Consumption ?? 0.0, 2);

            // Calculate efficiency rating using a transparent formula:
            // Base score 100.
            // Deduct 1 point for every 5 kWh consumed (max 40 points deduction).
            // Add 3 points for each active automation rule (max 15 points bonus).
            var activeRulesCount = await _context.AutomationRules
                .CountAsync(r => r.Device != null && r.Device.UserId == userId && r.IsActive);

            double usageDeduction = Math.Min(energyUsed / 5.0, 40.0);
            double ruleBonus = Math.Min(activeRulesCount * 3.0, 15.0);
            int efficiencyRating = (int)Math.Clamp(100.0 - usageDeduction + ruleBonus, 0.0, 100.0);

            // 2. Query Ollama for insights
            var insights = new List<string>();
            try
            {
                var systemPrompt = "You are a smart home energy assistant.";
                var userMessage = $@"Analyze this real data:
Month: {monthName}
Energy Used: {energyUsed} kWh
Electricity Bill: ₹{electricityBill}
Efficiency Rating: {efficiencyRating}/100
Most Used Device: {mostUsedDeviceName} ({mostUsedDeviceConsumption} W)

Generate 3 concise energy optimization suggestions.

Rules:
- Do not invent devices.
- Do not invent sensor readings.
- Do not create fake savings.
- Use only provided information.
- Format each suggestions as a single line, return exactly 3 lines.";

                var response = await _ollamaService.ChatAsync(systemPrompt, userMessage);
                if (!string.IsNullOrWhiteSpace(response))
                {
                    insights = response.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim().TrimStart('-', '*', '1', '2', '3', '.', ' '))
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Take(3)
                        .ToList();
                }
            }
            catch (Exception)
            {
                // Fallback insights if Ollama is not running
                insights = new List<string>
                {
                    $"Your monthly energy consumption is {energyUsed} kWh, resulting in an estimated bill of ₹{electricityBill}.",
                    $"The most power-consuming device in your network is the {mostUsedDeviceName}.",
                    "Consider setting up schedules for high-consumption devices when they are not in use to improve your rating."
                };
            }

            // Ensure we return exactly 3 insights
            while (insights.Count < 3)
            {
                insights.Add("Create more device rules to automate energy conservation.");
            }

            return new MonthlyReportDto
            {
                Month = monthName,
                EnergyUsed = energyUsed,
                ElectricityBill = electricityBill,
                Co2Saved = co2Saved,
                EfficiencyRating = efficiencyRating,
                MostUsedDevice = mostUsedDeviceName,
                MostUsedDeviceConsumption = mostUsedDeviceConsumption,
                AiInsights = insights
            };
        }
    }
}
