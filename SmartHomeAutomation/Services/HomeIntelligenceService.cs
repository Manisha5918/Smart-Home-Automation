using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Text.Json;

namespace SmartHomeAutomation.Services
{
    public class HomeIntelligenceService
    {
        private readonly ApplicationDbContext _context;

        private readonly RoutineLearningService
            _routineLearningService;

        public HomeIntelligenceService(
            ApplicationDbContext context,
            RoutineLearningService routineLearningService)
        {
            _context = context;

            _routineLearningService =
                routineLearningService;
        }

        public async Task<string> BuildHomeContextAsync(
            int userId)
        {
            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.DeviceId,
                    d.Name,
                    d.Type,
                    d.Location,
                    d.Status,

                    PowerConsumptionWatts =
                        d.PowerConsumption,

                    d.RoomId
                })
                .ToListAsync();

            var energyRecords = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId)
                .OrderByDescending(e => e.RecordedAt)
                .Take(50)
                .Select(e => new
                {
                    e.DeviceId,

                    DeviceName =
                        e.Device!.Name,

                    PowerConsumptionWatts =
                        e.PowerConsumption,

                    e.RecordedAt
                })
                .ToListAsync();

            var alerts = await _context.DeviceAlerts
                .Where(a =>
                    a.Device != null &&
                    a.Device.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new
                {
                    a.AlertType,
                    a.Message,
                    a.IsRead,
                    a.CreatedAt,

                    DeviceName =
                        a.Device!.Name
                })
                .ToListAsync();

            var maintenance =
                await _context.MaintenanceSchedules
                    .Where(m =>
                        m.Device != null &&
                        m.Device.UserId == userId)
                    .OrderBy(m => m.NextServiceDate)
                    .Take(10)
                    .Select(m => new
                    {
                        DeviceName =
                            m.Device!.Name,

                        m.NextServiceDate,
                        m.Status
                    })
                    .ToListAsync();

            var recentDeviceBehavior =
                await _context.ActivityLogs
                    .Where(a =>
                        a.UserId == userId &&
                        a.DeviceId != null &&
                        a.DeviceStatus != null &&
                        a.Action ==
                            "Device Status Changed")
                    .OrderByDescending(
                        a => a.CreatedAt)
                    .Take(50)
                    .Select(a => new
                    {
                        a.DeviceId,

                        DeviceName =
                            a.Device != null
                                ? a.Device.Name
                                : "Unknown",

                        Status =
                            a.DeviceStatus,

                        ChangedAt =
                            a.CreatedAt
                    })
                    .ToListAsync();

            var detectedRoutines =
                await _routineLearningService
                    .DetectRoutinesAsync(userId);

            var homeContext = new
            {
                GeneratedAt = DateTime.UtcNow,

                PowerConsumptionUnit = "Watts (W)",

                Devices = devices,

                RecentEnergyUsage = energyRecords,

                RecentAlerts = alerts,

                MaintenanceSchedules = maintenance,

                RecentDeviceBehavior =
                    recentDeviceBehavior,

                DetectedRoutines =
                    detectedRoutines
            };

            return JsonSerializer.Serialize(
                homeContext,
                new JsonSerializerOptions
                {
                    WriteIndented = true
                });
        }
    }
}