using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;
using System.Collections.Generic;
using System.Linq;

namespace SmartHomeAutomation.Services
{
    public class AutomationSchedulerService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly Dictionary<int, DateTime> _lastExecuted = new();

        public AutomationSchedulerService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        private async Task BroadcastRuleExecution(int userId, string deviceName, string status, string triggerType)
        {
            using var scope = _scopeFactory.CreateScope();
            var realtime = scope.ServiceProvider.GetRequiredService<IRealTimeNotificationService>();
            await realtime.NotifyAutomationExecutedAsync(userId, new
            {
                type = "automation_executed",
                deviceName,
                status,
                triggerType,
                timestamp = DateTime.Now
            });
            await realtime.NotifyDeviceStatusChangedAsync(userId, new
            {
                deviceName,
                newStatus = status,
                source = "automation",
                timestamp = DateTime.Now
            });
        }

        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken)
        {
            Console.WriteLine("Automation Scheduler Started...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();

                    var context = scope.ServiceProvider
                        .GetRequiredService<ApplicationDbContext>();

                    await ExecuteRules(context, scope.ServiceProvider);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Scheduler Error");
                    Console.WriteLine(ex);
                }

                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    stoppingToken);
            }
        }

        private async Task ExecuteRules(ApplicationDbContext context, IServiceProvider serviceProvider)
        {
            var now = DateTime.Now;

            Console.WriteLine();
            Console.WriteLine("====================================");
            Console.WriteLine($"Current Time : {now:hh:mm tt}");

            var weatherMetrics = new[] { "Temperature", "Rain", "AQI", "UV", "Humidity" };
            var rules = await context.AutomationRules
                .Include(r => r.Device)
                .Where(r =>
                    r.IsActive &&
                    (r.TriggerType == "Time" || weatherMetrics.Contains(r.TriggerType)))
                .ToListAsync();

            Console.WriteLine($"Active Rules : {rules.Count}");

            var timeRules = rules.Where(r => r.TriggerType == "Time").ToList();
            var weatherRules = rules.Where(r => weatherMetrics.Contains(r.TriggerType)).ToList();

            // Evaluate Time-based rules
            foreach (var rule in timeRules)
            {
                Console.WriteLine("------------------------------------");
                Console.WriteLine($"Rule : {rule.RuleName}");
                Console.WriteLine($"Stored Time : {rule.TriggerValue}");

                if (!DateTime.TryParse(rule.TriggerValue, out var triggerTime))
                {
                    Console.WriteLine("Invalid TriggerValue");
                    continue;
                }

                Console.WriteLine($"Parsed Time : {triggerTime:hh:mm tt}");

                if (triggerTime.Hour != now.Hour ||
                    triggerTime.Minute != now.Minute)
                {
                    Console.WriteLine("Time does not match");
                    continue;
                }

                if (_lastExecuted.TryGetValue(rule.RuleId, out var lastRun) &&
                    lastRun.Date == now.Date &&
                    lastRun.Hour == now.Hour &&
                    lastRun.Minute == now.Minute)
                {
                    Console.WriteLine("Rule already executed in this minute");
                    continue;
                }

                _lastExecuted[rule.RuleId] = now;

                Console.WriteLine("Time matched");

                if (rule.Device == null)
                {
                    Console.WriteLine("Device not found");
                    continue;
                }

                // Guard: Only apply action if device is not already in target status
                string targetStatus = rule.Action.Equals("TurnOn", StringComparison.OrdinalIgnoreCase) ? "On" : "Off";
                if (rule.Device.Status.Equals(targetStatus, StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("Device is already in target status");
                    continue;
                }

                rule.Device.Status = targetStatus;

                context.ActivityLogs.Add(new ActivityLog
                {
                    UserId = rule.Device.UserId,
                    DeviceId = rule.Device.DeviceId,
                    Action = "Automation Executed",
                    Description =
                        $"{rule.Device.Name} changed to {rule.Device.Status} by scheduler.",
                    DeviceStatus = rule.Device.Status,
                    CreatedAt = DateTime.Now
                });

                context.Notifications.Add(new Notification
                {
                    UserId = rule.Device.UserId,
                    Title = "Automation Executed",
                    Message =
                        $"{rule.Device.Name} automatically changed to {rule.Device.Status}.",
                    CreatedAt = DateTime.Now,
                    IsRead = false
                });

                await BroadcastRuleExecution(rule.Device.UserId, rule.Device.Name, targetStatus, "Time");

                Console.WriteLine("Rule Executed");
            }

            // Evaluate Weather-based rules
            if (weatherRules.Any())
            {
                try
                {
                    var weatherService = serviceProvider.GetRequiredService<IWeatherService>();
                    var weather = await weatherService.GetCurrentWeatherAsync();
                    var aq = await weatherService.GetAirQualityAsync();

                    foreach (var rule in weatherRules)
                    {
                        Console.WriteLine("------------------------------------");
                        Console.WriteLine($"Evaluating Weather Rule: {rule.RuleName} ({rule.TriggerType})");

                        if (rule.Device == null)
                        {
                            Console.WriteLine("Device not found");
                            continue;
                        }

                        // Guard: Only apply action if device is not already in target status
                        string targetStatus = rule.Action.Equals("TurnOn", StringComparison.OrdinalIgnoreCase) ? "On" : "Off";
                        if (rule.Device.Status.Equals(targetStatus, StringComparison.OrdinalIgnoreCase))
                        {
                            Console.WriteLine("Device is already in target status");
                            continue;
                        }

                        double currentVal = 0;
                        double threshold = ParseNumericValue(rule.TriggerValue);

                        if (rule.TriggerType.Equals("Temperature", StringComparison.OrdinalIgnoreCase))
                        {
                            currentVal = weather.Temperature;
                        }
                        else if (rule.TriggerType.Equals("Rain", StringComparison.OrdinalIgnoreCase))
                        {
                            currentVal = weather.RainProbability;
                        }
                        else if (rule.TriggerType.Equals("AQI", StringComparison.OrdinalIgnoreCase))
                        {
                            currentVal = aq.Aqi;
                        }
                        else if (rule.TriggerType.Equals("UV", StringComparison.OrdinalIgnoreCase))
                        {
                            currentVal = weather.UvIndex;
                        }
                        else if (rule.TriggerType.Equals("Humidity", StringComparison.OrdinalIgnoreCase))
                        {
                            currentVal = weather.Humidity;
                        }

                        bool conditionMatched = false;
                        if (rule.TriggerType.Equals("Temperature", StringComparison.OrdinalIgnoreCase))
                        {
                            if (rule.Action.Equals("TurnOn", StringComparison.OrdinalIgnoreCase))
                            {
                                conditionMatched = currentVal >= threshold;
                            }
                            else if (rule.Action.Equals("TurnOff", StringComparison.OrdinalIgnoreCase))
                            {
                                conditionMatched = currentVal <= threshold;
                            }
                        }
                        else
                        {
                            conditionMatched = currentVal >= threshold;
                        }

                        if (conditionMatched)
                        {
                            Console.WriteLine($"Weather condition matched! TriggerType: {rule.TriggerType}, Current: {currentVal}, Threshold: {threshold}");
                            
                            rule.Device.Status = targetStatus;

                            context.ActivityLogs.Add(new ActivityLog
                            {
                                UserId = rule.Device.UserId,
                                DeviceId = rule.Device.DeviceId,
                                Action = "Automation Executed",
                                Description = $"{rule.Device.Name} changed to {rule.Device.Status} by weather scheduler (Outdoor {rule.TriggerType}: {currentVal:F1}, threshold: {rule.TriggerValue}).",
                                DeviceStatus = rule.Device.Status,
                                CreatedAt = DateTime.Now
                            });

                            context.Notifications.Add(new Notification
                            {
                                UserId = rule.Device.UserId,
                                Title = "Automation Executed",
                                Message = $"{rule.Device.Name} automatically changed to {rule.Device.Status} due to outdoor {rule.TriggerType}.",
                                CreatedAt = DateTime.Now,
                                IsRead = false
                            });

                            await BroadcastRuleExecution(rule.Device.UserId, rule.Device.Name, targetStatus, $"Weather({rule.TriggerType})");

                            Console.WriteLine("Weather Rule Executed");
                        }
                        else
                        {
                            Console.WriteLine($"Weather condition did not match. TriggerType: {rule.TriggerType}, Current: {currentVal}, Threshold: {threshold}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error evaluating weather rules:");
                    Console.WriteLine(ex);
                }
            }

            await context.SaveChangesAsync();

            Console.WriteLine("Database Updated");
            Console.WriteLine("====================================");
        }

        private double ParseNumericValue(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return 0;
            var numericPart = new string(value.Where(c => char.IsDigit(c) || c == '.' || c == '-').ToArray());
            if (double.TryParse(numericPart, out double result))
            {
                return result;
            }
            return 0;
        }
    }
}