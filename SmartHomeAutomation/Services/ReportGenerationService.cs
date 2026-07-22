using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Text;
using System.Text.Json;

namespace SmartHomeAutomation.Services
{
    public class ReportGenerationService
    {
        private readonly ApplicationDbContext _context;
        private readonly OllamaService _ollamaService;
        private readonly IWeatherService _weatherService;

        public ReportGenerationService(
            ApplicationDbContext context,
            OllamaService ollamaService,
            IWeatherService weatherService)
        {
            _context = context;
            _ollamaService = ollamaService;
            _weatherService = weatherService;
        }

        public async Task<string> GenerateAsync(int userId, string reportType)
        {
            var data = await CollectDataAsync(userId, reportType);
            var prompt = BuildPrompt(reportType, data);
            return await _ollamaService.ChatAsync(prompt, $"Generate a {reportType} report.");
        }

        private async Task<string> CollectDataAsync(int userId, string reportType)
        {
            var now = DateTime.UtcNow;
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();

            object data = reportType.ToLower() switch
            {
                "daily" => await GetDailyData(userId, now),
                "weekly" => await GetWeeklyData(userId, now),
                "monthly" => await GetMonthlyData(userId, now),
                "energy" => await GetEnergyData(userId, now),
                "device health" or "device" => await GetDeviceHealthData(userId),
                "security" => await GetSecurityData(userId),
                "automation" => await GetAutomationData(userId),
                _ => await GetDailyData(userId, now)
            };

            return JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
        }

        private async Task<object> GetDailyData(int userId, DateTime now)
        {
            var todayStart = now.Date;
            var energy = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= todayStart).ToListAsync();
            var logs = await _context.ActivityLogs.Where(l => l.UserId == userId && l.CreatedAt >= todayStart).OrderByDescending(l => l.CreatedAt).Take(50).ToListAsync();
            var notifications = await _context.Notifications.Where(n => n.UserId == userId && n.CreatedAt >= todayStart).ToListAsync();
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();

            return new
            {
                ReportDate = now.ToString("yyyy-MM-dd"),
                TotalEnergyWh = energy.Sum(e => e.PowerConsumption),
                EnergyReadings = energy.Count,
                ActiveDevices = devices.Count(d => d.Status == "On"),
                TotalDevices = devices.Count,
                Activities = logs.Count,
                Notifications = notifications.Count,
                UnreadNotifications = notifications.Count(n => !n.IsRead),
                TopActivity = logs.GroupBy(l => l.Action).OrderByDescending(g => g.Count()).Select(g => new { Action = g.Key, Count = g.Count() }).FirstOrDefault(),
                HourlyBreakdown = energy.GroupBy(e => e.RecordedAt.Hour).Select(g => new { Hour = g.Key, Consumption = g.Sum(e => e.PowerConsumption) }).OrderBy(x => x.Hour).ToList(),
                MostActiveHours = energy.GroupBy(e => e.RecordedAt.Hour).OrderByDescending(g => g.Count()).Take(3).Select(g => new { Hour = g.Key, Events = g.Count() }).ToList()
            };
        }

        private async Task<object> GetWeeklyData(int userId, DateTime now)
        {
            var weekStart = now.Date.AddDays(-(int)now.DayOfWeek);
            var energy = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= weekStart).ToListAsync();
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
            var logs = await _context.ActivityLogs.Where(l => l.UserId == userId && l.CreatedAt >= weekStart).ToListAsync();
            var lastWeekStart = weekStart.AddDays(-7);
            var lastWeekEnergy = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= lastWeekStart && e.RecordedAt < weekStart).ToListAsync();

            return new
            {
                WeekStart = weekStart.ToString("yyyy-MM-dd"),
                WeekEnd = now.ToString("yyyy-MM-dd"),
                TotalEnergyWh = energy.Sum(e => e.PowerConsumption),
                DailyAverageWh = energy.Count > 0 ? energy.Sum(e => e.PowerConsumption) / Math.Max(1, (now - weekStart).Days + 1) : 0,
                LastWeekTotalWh = lastWeekEnergy.Sum(e => e.PowerConsumption),
                ChangeFromLastWeek = lastWeekEnergy.Any() ? ((energy.Sum(e => e.PowerConsumption) - lastWeekEnergy.Sum(e => e.PowerConsumption)) / lastWeekEnergy.Sum(e => e.PowerConsumption)) * 100 : 0,
                TotalActivities = logs.Count,
                ActiveDevices = devices.Count(d => d.Status == "On"),
                DailyBreakdown = energy.GroupBy(e => e.RecordedAt.Date).Select(g => new { Date = g.Key.ToString("yyyy-MM-dd"), Consumption = g.Sum(e => e.PowerConsumption) }).OrderBy(x => x.Date).ToList(),
                TopDeviceConsumption = energy.GroupBy(e => e.Device!.Name).Select(g => new { Device = g.Key, Total = g.Sum(e => e.PowerConsumption) }).OrderByDescending(x => x.Total).Take(5).ToList()
            };
        }

        private async Task<object> GetMonthlyData(int userId, DateTime now)
        {
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var energy = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= monthStart).ToListAsync();
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
            var maintenance = await _context.MaintenanceSchedules.Where(m => m.Device != null && m.Device.UserId == userId).ToListAsync();
            var alerts = await _context.DeviceAlerts.Where(a => a.Device != null && a.Device.UserId == userId && a.CreatedAt >= monthStart).ToListAsync();
            var goals = await _context.EnergyGoals.Where(g => g.UserId == userId).ToListAsync();

            return new
            {
                Month = now.ToString("yyyy-MM"),
                TotalEnergyWh = energy.Sum(e => e.PowerConsumption),
                DailyAverageWh = energy.Count > 0 ? energy.Sum(e => e.PowerConsumption) / Math.Max(1, now.Day) : 0,
                ProjectedMonthlyWh = (energy.Sum(e => e.PowerConsumption) / Math.Max(1, now.Day)) * DateTime.DaysInMonth(now.Year, now.Month),
                ActiveDevices = devices.Count(d => d.Status == "On"),
                TotalDevices = devices.Count,
                MaintenanceOverdue = maintenance.Count(m => m.NextServiceDate < now),
                MaintenanceUpcoming = maintenance.Count(m => m.NextServiceDate >= now),
                AlertsGenerated = alerts.Count,
                UnresolvedAlerts = alerts.Count(a => !a.IsRead),
                EnergyGoalMeters = goals.Select(g => new { MonthlyGoal = g.MonthlyGoal, Progress = energy.Sum(e => e.PowerConsumption) > 0 ? (energy.Sum(e => e.PowerConsumption) / g.MonthlyGoal) * 100 : 0 }).ToList(),
                WeeklyBreakdown = energy.GroupBy(e => (e.RecordedAt.Day - 1) / 7 + 1).Select(g => new { Week = g.Key, Consumption = g.Sum(e => e.PowerConsumption) }).OrderBy(x => x.Week).ToList()
            };
        }

        private async Task<object> GetEnergyData(int userId, DateTime now)
        {
            var thirtyDaysAgo = now.AddDays(-30);
            var energy = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId && e.RecordedAt >= thirtyDaysAgo).ToListAsync();
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
            var goals = await _context.EnergyGoals.Where(g => g.UserId == userId).ToListAsync();

            var deviceEnergy = energy.GroupBy(e => e.Device!.Name)
                .Select(g => new { Device = g.Key, TotalWh = g.Sum(e => e.PowerConsumption), AvgWh = g.Average(e => e.PowerConsumption), Readings = g.Count(), Type = devices.FirstOrDefault(d => d.Name == g.Key)?.Type ?? "" })
                .OrderByDescending(x => x.TotalWh).ToList();

            return new
            {
                Period = "Last 30 days",
                TotalEnergyWh = energy.Sum(e => e.PowerConsumption),
                DailyAverageWh = energy.Count > 0 ? energy.Sum(e => e.PowerConsumption) / 30 : 0,
                PeakDay = energy.GroupBy(e => e.RecordedAt.Date).OrderByDescending(g => g.Sum(e => e.PowerConsumption)).Select(g => new { Date = g.Key.ToString("yyyy-MM-dd"), Total = g.Sum(e => e.PowerConsumption) }).FirstOrDefault(),
                LowestDay = energy.GroupBy(e => e.RecordedAt.Date).OrderBy(g => g.Sum(e => e.PowerConsumption)).Select(g => new { Date = g.Key.ToString("yyyy-MM-dd"), Total = g.Sum(e => e.PowerConsumption) }).FirstOrDefault(),
                DeviceBreakdown = deviceEnergy,
                TopConsumer = deviceEnergy.FirstOrDefault(),
                TotalDevicesConsuming = deviceEnergy.Count,
                Goals = goals.Select(g => new { g.MonthlyGoal, Progress = energy.Sum(e => e.PowerConsumption) > 0 ? Math.Min((energy.Sum(e => e.PowerConsumption) / g.MonthlyGoal) * 100, 100) : 0 }).ToList()
            };
        }

        private async Task<object> GetDeviceHealthData(int userId)
        {
            var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
            var alerts = await _context.DeviceAlerts.Where(a => a.Device != null && a.Device.UserId == userId).OrderByDescending(a => a.CreatedAt).Take(100).ToListAsync();
            var maintenance = await _context.MaintenanceSchedules.Where(m => m.Device != null && m.Device.UserId == userId).ToListAsync();
            var energy = await _context.EnergyUsages.Where(e => e.Device != null && e.Device.UserId == userId).OrderByDescending(e => e.RecordedAt).Take(200).ToListAsync();

            var deviceHealth = devices.Select(d =>
            {
                var deviceAlerts = alerts.Where(a => a.DeviceId == d.DeviceId).ToList();
                var deviceMaint = maintenance.Where(m => m.DeviceId == d.DeviceId).ToList();
                var deviceEnergy = energy.Where(e => e.DeviceId == d.DeviceId).ToList();
                var avgConsumption = deviceEnergy.Any() ? deviceEnergy.Average(e => e.PowerConsumption) : 0;
                var recentConsumption = deviceEnergy.Take(10).Any() ? deviceEnergy.Take(10).Average(e => e.PowerConsumption) : 0;
                var isUnhealthy = recentConsumption > avgConsumption * 1.5 && avgConsumption > 0;

                return new
                {
                    d.DeviceId,
                    d.Name,
                    d.Type,
                    d.Status,
                    d.PowerConsumption,
                    d.Location,
                    AlertCount = deviceAlerts.Count,
                    UnresolvedAlerts = deviceAlerts.Count(a => !a.IsRead),
                    MaintenanceOverdue = deviceMaint.Count(m => m.NextServiceDate < DateTime.UtcNow),
                    AvgConsumption = avgConsumption,
                    RecentAvgConsumption = recentConsumption,
                    IsConsumptionSpiking = isUnhealthy,
                    HealthScore = Math.Max(0, 100 - (deviceAlerts.Count(a => !a.IsRead) * 15) - (deviceMaint.Count(m => m.NextServiceDate < DateTime.UtcNow) * 20)),
                    StatusLabel = isUnhealthy ? "Needs Attention" : d.Status == "On" ? "Healthy" : "Offline"
                };
            }).ToList();

            return new
            {
                TotalDevices = deviceHealth.Count,
                HealthyDevices = deviceHealth.Count(d => d.StatusLabel == "Healthy"),
                NeedsAttention = deviceHealth.Count(d => d.StatusLabel == "Needs Attention"),
                OfflineDevices = deviceHealth.Count(d => d.StatusLabel == "Offline"),
                AverageHealthScore = deviceHealth.Any() ? deviceHealth.Average(d => d.HealthScore) : 0,
                Devices = deviceHealth.OrderBy(d => d.HealthScore).ToList()
            };
        }

        private async Task<object> GetSecurityData(int userId)
        {
            var failedLogins = await _context.LoginHistories.Where(l => !l.IsSuccessful).OrderByDescending(l => l.AttemptedAt).Take(50).ToListAsync();
            var securityEvents = await _context.SecurityEvents.Where(s => s.UserId == userId).OrderByDescending(s => s.CreatedAt).Take(50).ToListAsync();
            var alerts = await _context.DeviceAlerts.Where(a => a.Device != null && a.Device.UserId == userId).OrderByDescending(a => a.CreatedAt).Take(50).ToListAsync();
            var userLogins = await _context.LoginHistories.Where(l => l.IsSuccessful).OrderByDescending(l => l.AttemptedAt).Take(50).ToListAsync();

            return new
            {
                TotalFailedLogins = failedLogins.Count,
                FailedLoginsLast24h = failedLogins.Count(l => l.AttemptedAt >= DateTime.UtcNow.AddHours(-24)),
                FailedLoginsLast7d = failedLogins.Count(l => l.AttemptedAt >= DateTime.UtcNow.AddDays(-7)),
                UniqueIPsAttempting = failedLogins.Where(l => l.IpAddress != null).Select(l => l.IpAddress).Distinct().Count(),
                MostRecentFailedLogin = failedLogins.FirstOrDefault() == null ? null : new { failedLogins.First().Email, failedLogins.First().AttemptedAt, failedLogins.First().IpAddress },
                SecurityEvents = securityEvents.Count,
                RecentSecurityEvents = securityEvents.Take(10).Select(e => new { e.EventType, e.Description, e.CreatedAt }),
                ActiveAlerts = alerts.Count(a => !a.IsRead),
                TotalAlerts = alerts.Count,
                RecentUserLogins = userLogins.Take(10).ToList(),
                RiskLevel = failedLogins.Count(l => l.AttemptedAt >= DateTime.UtcNow.AddHours(-1)) > 5 ? "High" : failedLogins.Count(l => l.AttemptedAt >= DateTime.UtcNow.AddHours(-24)) > 10 ? "Medium" : "Low"
            };
        }

        private async Task<object> GetAutomationData(int userId)
        {
            var rules = await _context.AutomationRules.Where(r => r.Device != null && r.Device.UserId == userId).ToListAsync();
            var logs = await _context.ActivityLogs.Where(l => l.UserId == userId && l.Action.Contains("Automation")).OrderByDescending(l => l.CreatedAt).Take(100).ToListAsync();

            return new
            {
                TotalRules = rules.Count,
                ActiveRules = rules.Count(r => r.IsActive),
                InactiveRules = rules.Count(r => !r.IsActive),
                TriggerBreakdown = rules.GroupBy(r => r.TriggerType).Select(g => new { Type = g.Key, Count = g.Count() }).ToList(),
                ActionBreakdown = rules.GroupBy(r => r.Action).Select(g => new { Action = g.Key, Count = g.Count() }).ToList(),
                RecentExecutions = logs.Take(20).Select(l => new { l.Description, l.CreatedAt }).ToList(),
                ExecutionCount = logs.Count,
                Rules = rules.Select(r => new { r.RuleId, r.RuleName, r.TriggerType, r.TriggerValue, r.Action, r.IsActive, DeviceName = r.Device?.Name ?? "Unknown" }).ToList()
            };
        }

        private string BuildPrompt(string reportType, string data)
        {
            return $"""
You are a professional smart home report generator. Generate a detailed {reportType} report.

Use this structure:
## Executive Summary
Brief overview of the most important findings

## Key Metrics
Important numbers and statistics from the data

## Detailed Analysis
Deep dive into patterns, trends, and anomalies

## Issues Detected
Problems that need attention

## Recommendations
Actionable steps the user should take

## Appendix
Raw data details if applicable

CRITICAL RULES:
- ONLY use data from the provided JSON below
- Never invent numbers or claims not supported by data
- If data is empty or insufficient, state that clearly
- Be specific - mention device names, exact values, dates
- Write in a professional, clear tone

DATA:
{data}
""";
        }
    }
}
