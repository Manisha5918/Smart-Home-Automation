using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class DeviceHealthService
    {
        private readonly ApplicationDbContext _context;

        public DeviceHealthService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DeviceHealthResult>
            CalculateHealthAsync(Device device)
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

            var healthScore = 100;

            healthScore -= anomalyCount * 5;

            healthScore -= totalAlerts * 2;

            healthScore =
                Math.Clamp(healthScore, 0, 100);

            device.HealthScore =
                healthScore;

            device.TotalAnomalies =
                anomalyCount;

            device.LastHealthUpdated =
                DateTime.Now;

            var status =
                GetHealthStatus(healthScore);

            await _context.SaveChangesAsync();

            return new DeviceHealthResult
            {
                DeviceId =
                    device.DeviceId,

                DeviceName =
                    device.Name,

                HealthScore =
                    healthScore,

                TotalAnomalies =
                    anomalyCount,

                TotalAlerts =
                    totalAlerts,

                HealthStatus =
                    status,

                Recommendation =
                    GetRecommendation(healthScore)
            };
        }

        private string GetHealthStatus(
            int healthScore)
        {
            if (healthScore >= 90)
                return "Healthy";

            if (healthScore >= 70)
                return "Needs Monitoring";

            if (healthScore >= 40)
                return "Maintenance Recommended";

            return "High Failure Risk";
        }

        private string GetRecommendation(
            int healthScore)
        {
            if (healthScore >= 90)
            {
                return
                    "Device is operating normally.";
            }

            if (healthScore >= 70)
            {
                return
                    "Monitor the device for unusual power usage.";
            }

            if (healthScore >= 40)
            {
                return
                    "Inspect the device and consider scheduling maintenance.";
            }

            return
                "Immediate device inspection is recommended.";
        }
    }

    public class DeviceHealthResult
    {
        public int DeviceId { get; set; }

        public string DeviceName { get; set; }
            = string.Empty;

        public int HealthScore { get; set; }

        public int TotalAnomalies { get; set; }

        public int TotalAlerts { get; set; }

        public string HealthStatus { get; set; }
            = string.Empty;

        public string Recommendation { get; set; }
            = string.Empty;
    }
}