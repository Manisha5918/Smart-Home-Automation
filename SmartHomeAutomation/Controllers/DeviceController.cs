using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Models;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeviceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private readonly AutomationRuleService
            _automationRuleService;

        private readonly EnergyAnomalyService
            _energyAnomalyService;


        private readonly DeviceHealthService _deviceHealthService;

        private readonly IRealTimeNotificationService _realtimeService;

        public DeviceController(
            ApplicationDbContext context,
            AutomationRuleService automationRuleService,
            EnergyAnomalyService energyAnomalyService,
            DeviceHealthService deviceHealthService,
            IRealTimeNotificationService realtimeService)
        {
            _context = context;

            _automationRuleService =
                automationRuleService;

            _energyAnomalyService =
                energyAnomalyService;

            _deviceHealthService =
                deviceHealthService;

            _realtimeService = realtimeService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetDevices()
        {
            var userId = GetCurrentUserId();

            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.DeviceId,
                    d.Name,
                    d.Type,
                    d.Location,
                    d.Status,
                    d.PowerConsumption,
                    d.UserId,
                    d.RoomId,

                    RoomName = d.Room != null
                        ? d.Room.RoomName
                        : null
                })
                .ToListAsync();

            return Ok(devices);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDevice(int id)
        {
            var userId = GetCurrentUserId();

            var device = await _context.Devices
                .Where(d =>
                    d.DeviceId == id &&
                    d.UserId == userId)
                .Select(d => new
                {
                    d.DeviceId,
                    d.Name,
                    d.Type,
                    d.Location,
                    d.Status,
                    d.PowerConsumption,
                    d.UserId,
                    d.RoomId,

                    RoomName = d.Room != null
                        ? d.Room.RoomName
                        : null
                })
                .FirstOrDefaultAsync();

            if (device == null)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }

            return Ok(device);
        }
        [HttpPost]
        public async Task<IActionResult> CreateDevice(
            CreateDeviceDto deviceDto)
        {
            var userId = GetCurrentUserId();

            Room? room = null;

            if (deviceDto.RoomId.HasValue)
            {
                room = await _context.Rooms
                    .FirstOrDefaultAsync(r =>
                        r.RoomId == deviceDto.RoomId.Value &&
                        r.UserId == userId);

                if (room == null)
                {
                    return BadRequest(new
                    {
                        message = "Invalid room."
                    });
                }
            }

            var device = new Device
            {
                Name = deviceDto.Name,
                Type = deviceDto.Type,
                Location = room?.RoomName ?? deviceDto.Location,
                Status = deviceDto.Status,
                PowerConsumption = deviceDto.PowerConsumption,
                UserId = userId,
                RoomId = deviceDto.RoomId
            };

            _context.Devices.Add(device);

            await _context.SaveChangesAsync();

            var deviceData = new
            {
                message = "Device created successfully.",
                deviceId = device.DeviceId,
                name = device.Name,
                type = device.Type,
                location = device.Location,
                status = device.Status,
                powerConsumption = device.PowerConsumption,
                roomId = device.RoomId,
                roomName = room?.RoomName
            };

            await _realtimeService.NotifyDeviceAddedAsync(userId, deviceData);

            return Ok(deviceData);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateDeviceStatus(
            int id,
            UpdateDeviceStatusDto dto)
        {
            var userId = GetCurrentUserId();

            if (dto.Status != "On" &&
                dto.Status != "Off" &&
                dto.Status != "Offline")
            {
                return BadRequest(new
                {
                    message =
                        "Status must be On, Off or Offline."
                });
            }

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == id &&
                    d.UserId == userId);

            if (device == null)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }

            var oldStatus = device.Status;

            device.Status = dto.Status;

            var activityLog = new ActivityLog
            {
                UserId = userId,

                DeviceId = device.DeviceId,

                Action = "Device Status Changed",

                Description =
                    $"{device.Name} changed from " +
                    $"{oldStatus} to {dto.Status}",

                DeviceStatus = dto.Status,

                CreatedAt = DateTime.Now
            };

            _context.ActivityLogs.Add(activityLog);

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyDeviceStatusChangedAsync(userId, new
            {
                deviceId = device.DeviceId,
                deviceName = device.Name,
                oldStatus,
                newStatus = device.Status,
                timestamp = DateTime.Now
            });

            if (device.Status == "Offline")
            {
                await _realtimeService.NotifyNewNotificationAsync(userId, new
                {
                    notificationId = 0,
                    title = "Device Offline",
                    message = $"{device.Name} went offline.",
                    isRead = false,
                    createdAt = DateTime.Now
                });
            }

            await _automationRuleService.EvaluateRulesAsync(device);

            return Ok(new
            {
                message =
                    "Device status updated successfully.",

                deviceId = device.DeviceId,

                deviceName = device.Name,

                oldStatus,

                newStatus = device.Status
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDevice(
            int id,
            CreateDeviceDto deviceDto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(deviceDto.Name))
            {
                return BadRequest(new
                {
                    message = "Device name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(deviceDto.Type))
            {
                return BadRequest(new
                {
                    message = "Device type is required."
                });
            }

            if (deviceDto.PowerConsumption < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Power consumption cannot be negative."
                });
            }

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == id &&
                    d.UserId == userId);

            if (device == null)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }

            Room? room = null;

            if (deviceDto.RoomId.HasValue)
            {
                room = await _context.Rooms
                    .FirstOrDefaultAsync(r =>
                        r.RoomId == deviceDto.RoomId.Value &&
                        r.UserId == userId);

                if (room == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Room not found or does not belong to the current user."
                    });
                }
            }

            var oldPowerConsumption =
                device.PowerConsumption;

            device.Name = deviceDto.Name.Trim();

            device.Type = deviceDto.Type.Trim();

            device.Location = room != null
                ? room.RoomName
                : deviceDto.Location.Trim();

            device.Status = deviceDto.Status;

            device.PowerConsumption =
                deviceDto.PowerConsumption;

            device.RoomId = room?.RoomId;

            var energyUsage = new EnergyUsage
            {
                DeviceId = device.DeviceId,

                PowerConsumption =
                    device.PowerConsumption,

                RecordedAt = DateTime.Now
            };

            _context.EnergyUsages.Add(energyUsage);

            var activityLog = new ActivityLog
            {
                UserId = userId,

                DeviceId = device.DeviceId,

                Action = "Device Updated",

                Description =
                    $"{device.Name} details were updated.",

                DeviceStatus = device.Status,

                CreatedAt = DateTime.Now
            };

            _context.ActivityLogs.Add(activityLog);

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyDeviceStatusChangedAsync(userId, new
            {
                deviceId = device.DeviceId,
                deviceName = device.Name,
                type = "updated",
                device.Type,
                device.Status,
                device.PowerConsumption,
                timestamp = DateTime.Now
            });

            await _automationRuleService.EvaluateRulesAsync(device);

            return Ok(new
            {
                message = "Device updated successfully.",

                device.DeviceId,
                device.Name,
                device.Type,
                device.Location,
                device.Status,
                device.PowerConsumption,
                device.RoomId,

                RoomName = room?.RoomName,

                oldPowerConsumption
            });
        }


        [HttpPut("{id}/power")]
        public async Task<IActionResult> UpdatePowerConsumption(
            int id,
            UpdatePowerConsumptionDto dto)
        {
            var userId = GetCurrentUserId();

            if (dto.PowerConsumption < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Power consumption cannot be negative."
                });
            }

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == id &&
                    d.UserId == userId);

            if (device == null)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }

            var oldPowerConsumption =
                device.PowerConsumption;

            var anomalyResult =
                await _energyAnomalyService
                    .AnalyzeDeviceAsync(
                        device,
                        dto.PowerConsumption);
            var healthResult =
    await _deviceHealthService
        .CalculateHealthAsync(device);

            device.PowerConsumption =
                dto.PowerConsumption;

            var energyUsage =
                new EnergyUsage
                {
                    DeviceId =
                        device.DeviceId,

                    PowerConsumption =
                        dto.PowerConsumption,

                    RecordedAt =
                        DateTime.Now
                };

            _context.EnergyUsages.Add(energyUsage);

            var activityLog =
                new ActivityLog
                {
                    UserId =
                        userId,

                    DeviceId =
                        device.DeviceId,

                    Action =
                        "Power Consumption Updated",

                    Description =
                        $"{device.Name} power consumption " +
                        $"changed from {oldPowerConsumption} " +
                        $"to {dto.PowerConsumption}.",

                    DeviceStatus =
                        device.Status,

                    CreatedAt =
                        DateTime.Now
                };

            _context.ActivityLogs.Add(activityLog);

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyEnergyUpdateAsync(userId, new
            {
                deviceId = device.DeviceId,
                deviceName = device.Name,
                oldPowerConsumption,
                newPowerConsumption = device.PowerConsumption,
                timestamp = DateTime.Now
            });

            await _automationRuleService
                .EvaluateRulesAsync(device);

            if (anomalyResult.IsAnomaly)
            {
                await _realtimeService.NotifySecurityAlertAsync(userId, new
                {
                    type = "EnergyAnomaly",
                    deviceId = device.DeviceId,
                    deviceName = device.Name,
                    message = anomalyResult.Message,
                    severity = "Medium",
                    timestamp = DateTime.Now
                });
            }

            return Ok(new
            {
                message =
                    "Power consumption updated successfully.",

                deviceId =
                    device.DeviceId,

                deviceName =
                    device.Name,

                oldPowerConsumption,

                newPowerConsumption =
                    device.PowerConsumption,

                energyIntelligence =
new
{
    anomalyResult.HasEnoughData,
    anomalyResult.IsAnomaly,
    anomalyResult.AveragePower,
    anomalyResult.CurrentPower,
    anomalyResult.DeviationPercentage,
    anomalyResult.Message
},

                deviceHealth =
new
{
    healthResult.HealthScore,
    healthResult.HealthStatus,
    healthResult.TotalAnomalies,
    healthResult.TotalAlerts,
    healthResult.Recommendation
}
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var userId = GetCurrentUserId();

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == id &&
                    d.UserId == userId);

            if (device == null)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }

            _context.Devices.Remove(device);

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyDeviceRemovedAsync(userId, device.DeviceId);

            return Ok(new
            {
                message = "Device deleted successfully."
            });
        }
    }
}