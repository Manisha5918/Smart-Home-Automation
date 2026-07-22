using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class EnergyAnomalyService
    {
        private readonly ApplicationDbContext _context;

        private const int MinimumReadings = 4;

        private const int ReadingLimit = 10;

        private const double DefaultThresholdPercentage = 50;

        public EnergyAnomalyService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<EnergyAnomalyResult>
            AnalyzeDeviceAsync(
                Device device,
                double currentPower)
        {
            var previousReadings =
                await _context.EnergyUsages
                    .Where(x =>
                        x.DeviceId == device.DeviceId)
                    .OrderByDescending(x => x.RecordedAt)
                    .Take(ReadingLimit)
                    .Select(x => x.PowerConsumption)
                    .ToListAsync();

            if (previousReadings.Count < MinimumReadings)
            {
                return new EnergyAnomalyResult
                {
                    IsAnomaly = false,
                    HasEnoughData = false,
                    CurrentPower = currentPower,
                    ReadingCount = previousReadings.Count,
                    Message =
                        "More usage data is required before anomaly detection can begin."
                };
            }

            var averagePower =
                previousReadings.Average();

            if (averagePower <= 0)
            {
                return new EnergyAnomalyResult
                {
                    IsAnomaly = false,
                    HasEnoughData = true,
                    CurrentPower = currentPower,
                    AveragePower = averagePower,
                    ReadingCount = previousReadings.Count,
                    Message =
                        "Average power is zero. Anomaly comparison was skipped."
                };
            }

            var deviationPercentage =
                ((currentPower - averagePower)
                / averagePower) * 100;

            var isAnomaly =
                deviationPercentage >=
                DefaultThresholdPercentage;

            var result =
                new EnergyAnomalyResult
                {
                    IsAnomaly = isAnomaly,

                    HasEnoughData = true,

                    CurrentPower =
                        Math.Round(currentPower, 2),

                    AveragePower =
                        Math.Round(averagePower, 2),

                    DeviationPercentage =
                        Math.Round(
                            deviationPercentage,
                            2),

                    ThresholdPercentage =
                        DefaultThresholdPercentage,

                    ReadingCount =
                        previousReadings.Count
                };

            if (!isAnomaly)
            {
                result.Message =
                    $"{device.Name} power usage is within its recent usage pattern.";

                return result;
            }

            result.Message =
                $"{device.Name} is consuming " +
                $"{result.DeviationPercentage}% more power " +
                $"than its recent average.";

            var alert =
                new DeviceAlert
                {
                    DeviceId = device.DeviceId,

                    AlertType =
                        "Energy Usage Anomaly",

                    Message =
                        $"{device.Name} is consuming " +
                        $"{result.CurrentPower} power units. " +
                        $"Recent average: " +
                        $"{result.AveragePower}. " +
                        $"Increase: " +
                        $"{result.DeviationPercentage}%."
                };

            _context.DeviceAlerts.Add(alert);

            var notification =
                new Notification
                {
                    UserId = device.UserId,

                    Title =
                        "Unusual Energy Usage Detected",

                    Message =
                        $"{device.Name} is consuming " +
                        $"{result.DeviationPercentage}% more power " +
                        $"than its recent average. " +
                        $"Check the device.",

                    IsRead = false,

                    CreatedAt = DateTime.Now
                };

            _context.Notifications.Add(notification);

            var activityLog =
                new ActivityLog
                {
                    UserId = device.UserId,

                    DeviceId = device.DeviceId,

                    Action =
                        "Energy Anomaly Detected",

                    Description =
                        $"{device.Name} exceeded its recent " +
                        $"average power usage by " +
                        $"{result.DeviationPercentage}%.",

                    DeviceStatus = device.Status,

                    CreatedAt = DateTime.Now
                };

            _context.ActivityLogs.Add(activityLog);

            return result;
        }
    }

    public class EnergyAnomalyResult
    {
        public bool IsAnomaly { get; set; }

        public bool HasEnoughData { get; set; }

        public double CurrentPower { get; set; }

        public double AveragePower { get; set; }

        public double DeviationPercentage { get; set; }

        public double ThresholdPercentage { get; set; }

        public int ReadingCount { get; set; }

        public string Message { get; set; }
            = string.Empty;
    }
}