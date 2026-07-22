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
    public class EnergyUsageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EnergyUsageController(
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
        public async Task<IActionResult> GetEnergyUsage()
        {
            var userId = GetCurrentUserId();

            var energyUsage = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId)
                .OrderByDescending(e => e.RecordedAt)
                .Select(e => new
                {
                    e.EnergyUsageId,
                    e.DeviceId,
                    DeviceName = e.Device!.Name,
                    e.PowerConsumption,
                    e.RecordedAt
                })
                .ToListAsync();

            return Ok(energyUsage);
        }

        [HttpGet("device/{deviceId}")]
        public async Task<IActionResult> GetDeviceEnergyUsage(
            int deviceId)
        {
            var userId = GetCurrentUserId();

            var deviceExists = await _context.Devices
                .AnyAsync(d =>
                    d.DeviceId == deviceId &&
                    d.UserId == userId);

            if (!deviceExists)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }

            var energyUsage = await _context.EnergyUsages
                .Where(e => e.DeviceId == deviceId)
                .OrderBy(e => e.RecordedAt)
                .Select(e => new
                {
                    e.EnergyUsageId,
                    e.DeviceId,
                    e.PowerConsumption,
                    e.RecordedAt
                })
                .ToListAsync();

            return Ok(energyUsage);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetEnergySummary()
        {
            var userId = GetCurrentUserId();

            var energyRecords = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId)
                .ToListAsync();

            if (!energyRecords.Any())
            {
                return Ok(new
                {
                    totalRecords = 0,
                    averagePowerConsumption = 0,
                    maximumPowerConsumption = 0,
                    minimumPowerConsumption = 0
                });
            }

            return Ok(new
            {
                totalRecords = energyRecords.Count,

                averagePowerConsumption =
                    energyRecords.Average(
                        e => e.PowerConsumption),

                maximumPowerConsumption =
                    energyRecords.Max(
                        e => e.PowerConsumption),

                minimumPowerConsumption =
                    energyRecords.Min(
                        e => e.PowerConsumption)
            });
        }

        [HttpGet("chart/{deviceId}")]
        public async Task<IActionResult> GetEnergyChart(
            int deviceId)
        {
            var userId = GetCurrentUserId();

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == deviceId &&
                    d.UserId == userId);

            if (device == null)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }

            var chartData = await _context.EnergyUsages
                .Where(e => e.DeviceId == deviceId)
                .OrderBy(e => e.RecordedAt)
                .Select(e => new
                {
                    time = e.RecordedAt,
                    power = e.PowerConsumption
                })
                .ToListAsync();

            return Ok(new
            {
                deviceId = device.DeviceId,
                deviceName = device.Name,
                data = chartData
            });
        }

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyEnergyUsage()
        {
            var userId = GetCurrentUserId();

            var energyRecords = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId)
                .ToListAsync();

            var dailyUsage = energyRecords
                .GroupBy(e => e.RecordedAt.Date)
                .Select(group => new
                {
                    date = group.Key,
                    averagePowerConsumption =
                        group.Average(
                            e => e.PowerConsumption),

                    maximumPowerConsumption =
                        group.Max(
                            e => e.PowerConsumption),

                    totalRecords = group.Count()
                })
                .OrderBy(d => d.date)
                .ToList();

            return Ok(dailyUsage);
        }
    }
}