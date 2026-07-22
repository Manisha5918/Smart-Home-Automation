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
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VacationModeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IRealTimeNotificationService _realtimeService;

        public VacationModeController(
            ApplicationDbContext context,
            IRealTimeNotificationService realtimeService)
        {
            _context = context;
            _realtimeService = realtimeService;
        }


        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!);
        }



        [HttpPost("enable")]
        public async Task<IActionResult> EnableVacationMode(
            VacationModeDto dto)
        {
            var userId = GetCurrentUserId();


            var existing =
                await _context.VacationModes
                .FirstOrDefaultAsync(v =>
                    v.UserId == userId &&
                    v.IsEnabled);


            if (existing != null)
            {
                return BadRequest(new
                {
                    message =
                    "Vacation mode is already enabled."
                });
            }



            var devices =
                await _context.Devices
                .Where(d =>
                    d.UserId == userId)
                .ToListAsync();



            if (devices.Count == 0)
            {
                return BadRequest(new
                {
                    message =
                    "No devices found."
                });
            }



            var vacation =
                new VacationMode
                {
                    UserId = userId,

                    IsEnabled = true,

                    StartDate =
                    dto.StartDate,

                    EndDate =
                    dto.EndDate,

                    SecurityModeEnabled =
                    dto.EnableSecurityMode,

                    CreatedAt =
                    DateTime.Now
                };


            _context.VacationModes.Add(vacation);

            await _context.SaveChangesAsync();



            double totalSavedPowerWatts = 0;



            foreach (var device in devices)
            {
                var state =
                    new VacationDeviceState
                    {
                        VacationModeId =
                        vacation.VacationModeId,

                        DeviceId =
                        device.DeviceId,

                        PreviousStatus =
                        device.Status
                    };


                _context.VacationDeviceStates
                    .Add(state);



                bool essential =
                    device.Type == "Refrigerator"
                    ||
                    device.Type == "CCTV"
                    ||
                    device.Type == "Router";



                if (!essential)
                {
                    if (string.Equals(
                        device.Status,
                        "On",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        totalSavedPowerWatts +=
                            device.PowerConsumption;
                    }


                    device.Status = "Off";
                }
            }


            var duration =
    dto.EndDate - dto.StartDate;


            var durationHours =
                Math.Max(
                    0,
                    duration.TotalHours);


            vacation.EstimatedEnergySaved =
                totalSavedPowerWatts *
                durationHours /
                1000.0;


            const decimal electricityRatePerKWh = 8m;


            vacation.EstimatedMoneySaved =
                (decimal)vacation.EstimatedEnergySaved *
                electricityRatePerKWh;


            const double co2KgPerKWh = 0.82;


            vacation.EstimatedCO2Saved =
                vacation.EstimatedEnergySaved *
                co2KgPerKWh;



            var notification =
                new UserNotification
                {
                    UserId = userId,

                    Message =
                        "Vacation Mode enabled. " +
                        "Unnecessary devices switched off.",

                    CreatedAt =
                        DateTime.Now,

                    IsRead = false
                };


            _context.UserNotifications
                .Add(notification);



            var activity =
                new ActivityLog
                {
                    UserId = userId,

                    Action =
                        "Vacation Mode Enabled",

                    Description =
                        "Vacation mode started. " +
                        "Devices optimized automatically.",

                    CreatedAt =
                        DateTime.Now
                };


            _context.ActivityLogs.Add(activity);



            await _context.SaveChangesAsync();



            await _realtimeService.NotifyNewNotificationAsync(userId, new
            {
                title = "Vacation Mode Enabled",
                message = "Vacation mode enabled. Unnecessary devices switched off.",
                isRead = false,
                createdAt = DateTime.Now
            });

            await _realtimeService.NotifyNewActivityAsync(userId, activity);

            await _realtimeService.NotifyAutomationExecutedAsync(userId, new
            {
                type = "vacation_mode_enabled",
                devicesTurnedOff = devices.Count(d =>
                    !(d.Type == "Refrigerator" || d.Type == "CCTV" || d.Type == "Router")),
                estimatedEnergySaved = vacation.EstimatedEnergySaved,
                timestamp = DateTime.Now
            });

            return Ok(new
            {
                message =
                    "Vacation mode enabled successfully.",

                estimatedEnergySaved =
                    vacation.EstimatedEnergySaved,

                estimatedMoneySaved =
                    vacation.EstimatedMoneySaved,

                estimatedCO2Saved =
                    vacation.EstimatedCO2Saved
            });
        }



        [HttpPost("disable")]
        public async Task<IActionResult> DisableVacationMode()
        {
            var userId = GetCurrentUserId();


            var vacation =
                await _context.VacationModes
                .FirstOrDefaultAsync(v =>
                    v.UserId == userId &&
                    v.IsEnabled);


            if (vacation == null)
            {
                return BadRequest(new
                {
                    message =
                        "Vacation mode is not enabled."
                });
            }



            var states =
                await _context.VacationDeviceStates
                .Where(v =>
                    v.VacationModeId ==
                    vacation.VacationModeId)
                .ToListAsync();



            foreach (var state in states)
            {
                var device =
                    await _context.Devices
                    .FirstOrDefaultAsync(d =>
                        d.DeviceId ==
                        state.DeviceId);


                if (device != null)
                {
                    device.Status =
                        state.PreviousStatus;
                }
            }



            vacation.IsEnabled = false;



            var notification =
                new UserNotification
                {
                    UserId = userId,

                    Message =
                        "Vacation Mode disabled. " +
                        "Previous device states restored.",

                    CreatedAt =
                        DateTime.Now,

                    IsRead = false
                };


            _context.UserNotifications
                .Add(notification);



            var activity =
                new ActivityLog
                {
                    UserId = userId,

                    Action =
                        "Vacation Mode Disabled",

                    Description =
                        "Vacation mode stopped. " +
                        "Previous device states restored.",

                    CreatedAt =
                        DateTime.Now
                };


            _context.ActivityLogs.Add(activity);

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyNewNotificationAsync(userId, new
            {
                title = "Vacation Mode Disabled",
                message = "Vacation mode disabled. Previous device states restored.",
                isRead = false,
                createdAt = DateTime.Now
            });

            await _realtimeService.NotifyNewActivityAsync(userId, activity);

            await _realtimeService.NotifyAutomationExecutedAsync(userId, new
            {
                type = "vacation_mode_disabled",
                restoredDevices = states.Count,
                timestamp = DateTime.Now
            });

            return Ok(new
            {
                message =
                    "Vacation mode disabled successfully.",

                restoredDevices =
                    states.Count,

                estimatedEnergySaved =
                    vacation.EstimatedEnergySaved,

                estimatedMoneySaved =
                    vacation.EstimatedMoneySaved,

                estimatedCO2Saved =
                    vacation.EstimatedCO2Saved
            });
        }


        [HttpGet("summary")]
        public async Task<IActionResult> GetVacationSummary()
        {
            var userId = GetCurrentUserId();


            var vacation =
                await _context.VacationModes
                .Where(v =>
                    v.UserId == userId)
                .OrderByDescending(v =>
                    v.CreatedAt)
                .FirstOrDefaultAsync();


            if (vacation == null)
            {
                return NotFound(new
                {
                    message =
                        "No vacation history found."
                });
            }


            var devicesOff =
                await _context.VacationDeviceStates
                .Where(v =>
                    v.VacationModeId ==
                    vacation.VacationModeId)
                .CountAsync();


            var devicesRunning =
                await _context.Devices
                .Where(d =>
                    d.UserId == userId &&
                    d.Status == "On")
                .CountAsync();


            var days =
                Math.Max(
                    0,
                    (vacation.EndDate -
                     vacation.StartDate).Days);


            return Ok(new
            {
                vacationStatus =
                    vacation.IsEnabled
                    ? "Active"
                    : "Inactive",

                durationDays =
                    days,

                devicesTurnedOff =
                    devicesOff,

                devicesKeptRunning =
                    devicesRunning,

                energySaved =
                    $"{vacation.EstimatedEnergySaved:F2} kWh",

                moneySaved =
                    $"₹{vacation.EstimatedMoneySaved:F2}",

                co2Saved =
                    $"{vacation.EstimatedCO2Saved:F2} kg",

                securityStatus =
                    vacation.SecurityModeEnabled
                    ? "Protected"
                    : "Disabled"
            });
        }



        [HttpPost("security-event")]
        public async Task<IActionResult> SecurityEvent(
            VacationSecurityEventDto dto)
        {
            var userId = GetCurrentUserId();


            var vacation =
                await _context.VacationModes
                .FirstOrDefaultAsync(v =>
                    v.UserId == userId &&
                    v.IsEnabled);


            if (vacation == null)
            {
                return BadRequest(new
                {
                    message =
                        "Vacation mode is not active."
                });
            }


            if (!vacation.SecurityModeEnabled)
            {
                return BadRequest(new
                {
                    message =
                        "Vacation security mode is disabled."
                });
            }


            var device =
                await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId &&
                    d.Name == dto.DeviceName);


            if (device == null)
            {
                return NotFound(new
                {
                    message =
                        "Device not found."
                });
            }


            var riskLevel =
                dto.EventType.Contains(
                    "Motion",
                    StringComparison.OrdinalIgnoreCase)
                ? "High"
                : "Medium";


            var alert =
                new DeviceAlert
                {
                    DeviceId =
                        device.DeviceId,

                    AlertType =
                        "Security Alert",

                    Message =
                        $"{dto.EventType} detected at " +
                        $"{dto.DeviceName}.",

                    CreatedAt =
                        DateTime.Now,

                    IsRead =
                        false
                };


            _context.DeviceAlerts.Add(alert);


            var notification =
                new UserNotification
                {
                    UserId =
                        userId,

                    Message =
                        $"Security alert: " +
                        $"{dto.EventType} detected at " +
                        $"{dto.Location}.",

                    CreatedAt =
                        DateTime.Now,

                    IsRead =
                        false
                };


            _context.UserNotifications
                .Add(notification);


            var activity =
                new ActivityLog
                {
                    UserId =
                        userId,

                    DeviceId =
                        device.DeviceId,

                    Action =
                        "Vacation Security Event",

                    Description =
                        $"{dto.EventType} detected at " +
                        $"{dto.Location}. " +
                        $"Risk level: {riskLevel}.",

                    DeviceStatus =
                        device.Status,

                    CreatedAt =
                        DateTime.Now
                };


            _context.ActivityLogs.Add(activity);


            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Security alert generated.",

                riskLevel,

                eventType =
                    dto.EventType,

                device =
                    device.Name
            });
        }
    }
}