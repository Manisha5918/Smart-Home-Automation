using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var userId = GetCurrentUserId();

            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .ToListAsync();

            var totalDevices = devices.Count;

            var activeDevices = devices.Count(d =>
                d.Status.Equals(
                    "On",
                    StringComparison.OrdinalIgnoreCase));

            var offlineDevices = devices.Count(d =>
                d.Status.Equals(
                    "Offline",
                    StringComparison.OrdinalIgnoreCase));

            var totalPowerConsumption = devices
                .Sum(d => d.PowerConsumption);

            var averagePowerConsumption = devices.Any()
                ? devices.Average(d => d.PowerConsumption)
                : 0;

            var highPowerDevices = devices.Count(d =>
                d.PowerConsumption > 40);

            var unreadAlerts = await _context.DeviceAlerts
                .CountAsync(a =>
                    a.Device != null &&
                    a.Device.UserId == userId &&
                    !a.IsRead);

            var unreadNotifications =
                await _context.Notifications
                    .CountAsync(n =>
                        n.UserId == userId &&
                        !n.IsRead);

            var favoriteDevices =
                await _context.FavoriteDevices
                    .CountAsync(f =>
                        f.UserId == userId);

            var pendingMaintenance =
                await _context.MaintenanceSchedules
                    .CountAsync(m =>
                        m.Device != null &&
                        m.Device.UserId == userId &&
                        m.Status == "Pending");

            var activeAutomationRules =
                await _context.AutomationRules
                    .CountAsync(r =>
                        r.Device != null &&
                        r.Device.UserId == userId &&
                        r.IsActive);

            var recentActivities =
                await _context.ActivityLogs
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(5)
                    .Select(a => new
                    {
                        a.ActivityLogId,
                        a.DeviceId,
                        a.Action,
                        a.Description,
                        a.CreatedAt
                    })
                    .ToListAsync();

            var recentAlerts =
                await _context.DeviceAlerts
                    .Where(a =>
                        a.Device != null &&
                        a.Device.UserId == userId)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(5)
                    .Select(a => new
                    {
                        a.AlertId,
                        a.DeviceId,
                        deviceName = a.Device!.Name,
                        a.AlertType,
                        a.Message,
                        a.IsRead,
                        a.CreatedAt
                    })
                    .ToListAsync();

            var now = DateTime.Now;

            var upcomingMaintenance =
                await _context.MaintenanceSchedules
                    .Where(m =>
                        m.Device != null &&
                        m.Device.UserId == userId &&
                        m.Status == "Pending" &&
                        m.NextServiceDate >= now)
                    .OrderBy(m => m.NextServiceDate)
                                .Take(5)
                    .Select(m => new
                    {
                        m.MaintenanceId,
                        m.DeviceId,
                        deviceName = m.Device!.Name,
                        m.ServiceType,
                        m.Notes,
                        m.NextServiceDate,
                        m.Status
                    })
                    .ToListAsync();

            return Ok(new
            {
                statistics = new
                {
                    totalDevices,
                    activeDevices,
                    offlineDevices,
                    totalPowerConsumption,
                    averagePowerConsumption,
                    highPowerDevices,
                    unreadAlerts,
                    unreadNotifications,
                    favoriteDevices,
                    pendingMaintenance,
                    activeAutomationRules
                },

                recentActivities,

                recentAlerts,

                upcomingMaintenance
            });
        }

        [HttpGet("recent-activities")]
        public async Task<IActionResult> GetRecentActivities()
        {
            var userId = GetCurrentUserId();

            var activities = await _context.ActivityLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new
                {
                    a.ActivityLogId,
                    a.DeviceId,
                    a.Action,
                    a.Description,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(activities);
        }

        [HttpGet("recent-alerts")]
        public async Task<IActionResult> GetRecentAlerts()
        {
            var userId = GetCurrentUserId();

            var alerts = await _context.DeviceAlerts
                .Where(a =>
                    a.Device != null &&
                    a.Device.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new
                {
                    a.AlertId,
                    a.DeviceId,
                    deviceName = a.Device!.Name,
                    a.AlertType,
                    a.Message,
                    a.IsRead,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(alerts);
        }

        [HttpGet("upcoming-maintenance")]
        public async Task<IActionResult> GetUpcomingMaintenance()
        {
            var userId = GetCurrentUserId();

            var now = DateTime.Now;

            var maintenance =
                await _context.MaintenanceSchedules
                    .Where(m =>
                        m.Device != null &&
                        m.Device.UserId == userId &&
                        m.Status == "Pending" &&
                        m.NextServiceDate >= now)
                    .OrderBy(m => m.NextServiceDate)
                    .Take(5)
                    .Select(m => new
                    {
                        m.MaintenanceId,
                        m.DeviceId,
                        deviceName = m.Device!.Name,
                        m.ServiceType,
                        m.Notes,
                        m.NextServiceDate,
                        m.Status
                    })
                    .ToListAsync();

            return Ok(maintenance);
        }
    }
}