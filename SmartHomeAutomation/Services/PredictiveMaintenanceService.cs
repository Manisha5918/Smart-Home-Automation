using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class PredictiveMaintenanceService
    {
        private readonly ApplicationDbContext _context;

        public PredictiveMaintenanceService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PredictiveMaintenanceResult>
            PredictMaintenanceAsync(Device device)
        {
            var anomalyCount =
                await _context.DeviceAlerts
                    .CountAsync(a =>
                        a.DeviceId == device.DeviceId &&
                        a.AlertType == "Energy Usage Anomaly");

            var totalAlerts =
                await _context.DeviceAlerts
                    .CountAsync(a =>
                        a.DeviceId == device.DeviceId);

            var recentAlerts =
                await _context.DeviceAlerts
                    .CountAsync(a =>
                        a.DeviceId == device.DeviceId);

            var recentEnergyReadings =
                await _context.EnergyUsages
                    .Where(e =>
                        e.DeviceId == device.DeviceId)
                    .OrderByDescending(e => e.RecordedAt)
                    .Take(10)
                    .Select(e => e.PowerConsumption)
                    .ToListAsync();

            var riskScore = 0;

            var reasons = new List<string>();

            if (device.HealthScore < 40)
            {
                riskScore += 40;

                reasons.Add(
                    "Device health score is critically low.");
            }
            else if (device.HealthScore < 70)
            {
                riskScore += 25;

                reasons.Add(
                    "Device health score is below the recommended range.");
            }
            else if (device.HealthScore < 90)
            {
                riskScore += 10;

                reasons.Add(
                    "Device health requires monitoring.");
            }

            if (anomalyCount >= 5)
            {
                riskScore += 30;

                reasons.Add(
                    "Multiple energy usage anomalies detected.");
            }
            else if (anomalyCount >= 2)
            {
                riskScore += 15;

                reasons.Add(
                    "Repeated energy anomalies detected.");
            }
            else if (anomalyCount == 1)
            {
                riskScore += 5;

                reasons.Add(
                    "An energy anomaly was detected.");
            }

            if (totalAlerts >= 10)
            {
                riskScore += 20;

                reasons.Add(
                    "High number of device alerts detected.");
            }
            else if (totalAlerts >= 5)
            {
                riskScore += 10;

                reasons.Add(
                    "Repeated device alerts detected.");
            }

            if (recentAlerts >= 5)
            {
                riskScore += 10;

                reasons.Add(
                    "Frequent recent device alerts detected.");
            }

            if (recentEnergyReadings.Count >= 4)
            {
                var averagePower =
                    recentEnergyReadings.Average();

                var maxPower =
                    recentEnergyReadings.Max();

                if (averagePower > 0)
                {
                    var peakDeviation =
                        ((maxPower - averagePower)
                        / averagePower) * 100;

                    if (peakDeviation >= 80)
                    {
                        riskScore += 15;

                        reasons.Add(
                            "Large power consumption fluctuations detected.");
                    }
                    else if (peakDeviation >= 40)
                    {
                        riskScore += 8;

                        reasons.Add(
                            "Moderate power consumption fluctuations detected.");
                    }
                }
            }

            riskScore =
                Math.Clamp(riskScore, 0, 100);

            var riskLevel =
                GetRiskLevel(riskScore);

            var estimatedMaintenanceDays =
                GetEstimatedMaintenanceDays(riskScore);

            var recommendation =
                GetRecommendation(riskScore);

            if (reasons.Count == 0)
            {
                reasons.Add(
                    "No significant maintenance risk indicators detected.");
            }

            return new PredictiveMaintenanceResult
            {
                DeviceId =
                    device.DeviceId,

                DeviceName =
                    device.Name,

                HealthScore =
                    device.HealthScore,

                RiskScore =
                    riskScore,

                RiskLevel =
                    riskLevel,

                EstimatedMaintenanceDays =
                    estimatedMaintenanceDays,

                Recommendation =
                    recommendation,

                Reasons =
                    reasons
            };
        }

        private string GetRiskLevel(
            int riskScore)
        {
            if (riskScore >= 80)
                return "Critical";

            if (riskScore >= 60)
                return "High";

            if (riskScore >= 30)
                return "Medium";

            return "Low";
        }

        private int? GetEstimatedMaintenanceDays(
            int riskScore)
        {
            if (riskScore >= 80)
                return 3;

            if (riskScore >= 60)
                return 7;

            if (riskScore >= 40)
                return 14;

            if (riskScore >= 30)
                return 30;

            return null;
        }

        private string GetRecommendation(
            int riskScore)
        {
            if (riskScore >= 80)
            {
                return
                    "Immediate device inspection is recommended.";
            }

            if (riskScore >= 60)
            {
                return
                    "Schedule device maintenance within the next week.";
            }

            if (riskScore >= 30)
            {
                return
                    "Monitor the device and consider preventive maintenance.";
            }

            return
                "Device is currently operating within normal maintenance conditions.";
        }
    }

    public class PredictiveMaintenanceResult
    {
        public int DeviceId { get; set; }

        public string DeviceName { get; set; }
            = string.Empty;

        public int HealthScore { get; set; }

        public int RiskScore { get; set; }

        public string RiskLevel { get; set; }
            = string.Empty;

        public int? EstimatedMaintenanceDays { get; set; }

        public string Recommendation { get; set; }
            = string.Empty;

        public List<string> Reasons { get; set; }
            = new();
    }
}