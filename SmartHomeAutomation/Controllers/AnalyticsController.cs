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
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsController(
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

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var userId = GetCurrentUserId();

            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .ToListAsync();

            var totalDevices = devices.Count;

            var activeDevices = devices.Count(
                d => d.Status == "On");

            var offlineDevices = devices.Count(
                d => d.Status == "Offline");

            var totalPowerConsumption =
                devices.Sum(
                    d => d.PowerConsumption);

            var averagePowerConsumption =
                devices.Any()
                    ? devices.Average(
                        d => d.PowerConsumption)
                    : 0;

            return Ok(new
            {
                totalDevices,

                activeDevices,

                offlineDevices,

                totalPowerConsumption,

                averagePowerConsumption
            });
        }

        [HttpGet("power-by-room")]
        public async Task<IActionResult> GetPowerByRoom()
        {
            var userId = GetCurrentUserId();

            var powerByRoom = await _context.Devices
                .Where(d =>
                    d.UserId == userId &&
                    d.RoomId != null)
                .GroupBy(d => new
                {
                    d.RoomId,

                    RoomName = d.Room!.RoomName
                })
                .Select(group => new
                {
                    roomId = group.Key.RoomId,

                    roomName =
                        group.Key.RoomName,

                    totalDevices =
                        group.Count(),

                    activeDevices =
                        group.Count(
                            d => d.Status == "On"),

                    totalPowerConsumption =
                        group.Sum(
                            d => d.PowerConsumption),

                    averagePowerConsumption =
                        group.Average(
                            d => d.PowerConsumption)
                })
                .OrderByDescending(r =>
                    r.totalPowerConsumption)
                .ToListAsync();

            return Ok(powerByRoom);
        }

        [HttpGet("power-by-location")]
        public async Task<IActionResult>
            GetPowerByLocation()
        {
            var userId = GetCurrentUserId();

            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    Location =
                        d.Room != null
                            ? d.Room.RoomName
                            : d.Location,

                    d.PowerConsumption
                })
                .ToListAsync();

            var powerByLocation = devices
                .GroupBy(d => d.Location)
                .Select(group => new
                {
                    location = group.Key,

                    totalDevices =
                        group.Count(),

                    totalPowerConsumption =
                        group.Sum(
                            d => d.PowerConsumption),

                    averagePowerConsumption =
                        group.Average(
                            d => d.PowerConsumption)
                })
                .OrderByDescending(x =>
                    x.totalPowerConsumption)
                .ToList();

            return Ok(powerByLocation);
        }

        [HttpGet("power-by-device")]
        public async Task<IActionResult>
            GetPowerByDevice()
        {
            var userId = GetCurrentUserId();

            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.DeviceId,

                    deviceName = d.Name,

                    d.Type,

                    roomId = d.RoomId,

                    roomName =
                        d.Room != null
                            ? d.Room.RoomName
                            : null,

                    d.Status,

                    powerConsumption =
                        d.PowerConsumption
                })
                .OrderByDescending(d =>
                    d.powerConsumption)
                .ToListAsync();

            return Ok(devices);
        }

        [HttpGet("highest-consuming-device")]
        public async Task<IActionResult>
            GetHighestConsumingDevice()
        {
            var userId = GetCurrentUserId();

            var device = await _context.Devices
                .Where(d => d.UserId == userId)
                .OrderByDescending(d =>
                    d.PowerConsumption)
                .Select(d => new
                {
                    d.DeviceId,

                    deviceName = d.Name,

                    d.Type,

                    roomId = d.RoomId,

                    roomName =
                        d.Room != null
                            ? d.Room.RoomName
                            : null,

                    d.Status,

                    powerConsumption =
                        d.PowerConsumption
                })
                .FirstOrDefaultAsync();

            if (device == null)
            {
                return NotFound(new
                {
                    message = "No devices found."
                });
            }

            return Ok(device);
        }

        [HttpGet("energy-history")]
        public async Task<IActionResult>
            GetEnergyHistory()
        {
            var userId = GetCurrentUserId();

            var energyHistory =
                await _context.EnergyUsages
                    .Where(e =>
                        e.Device != null &&
                        e.Device.UserId == userId)
                    .OrderByDescending(e =>
                        e.RecordedAt)
                    .Select(e => new
                    {
                        e.EnergyUsageId,

                        e.DeviceId,

                        deviceName =
                            e.Device!.Name,

                        roomId =
                            e.Device.RoomId,

                        roomName =
                            e.Device.Room != null
                                ? e.Device.Room.RoomName
                                : null,

                        e.PowerConsumption,

                        e.RecordedAt
                    })
                    .Take(100)
                    .ToListAsync();

            return Ok(energyHistory);
        }
    }
}