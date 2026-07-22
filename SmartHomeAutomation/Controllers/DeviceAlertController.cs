using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Models;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeviceAlertController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DeviceAlertController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetDeviceAlerts()
        {
            var userId = GetCurrentUserId();

            var alerts = await _context.DeviceAlerts
                .Where(a => a.Device != null &&
                            a.Device.UserId == userId)
                .Include(a => a.Device)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(alerts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeviceAlert(int id)
        {
            var userId = GetCurrentUserId();

            var alert = await _context.DeviceAlerts
                .Include(a => a.Device)
                .FirstOrDefaultAsync(a =>
                    a.AlertId == id &&
                    a.Device != null &&
                    a.Device.UserId == userId
                );

            if (alert == null)
            {
                return NotFound(new
                {
                    message = "Device alert not found."
                });
            }

            return Ok(alert);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDeviceAlert(
            CreateDeviceAlertDto alertDto)
        {
            var userId = GetCurrentUserId();

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == alertDto.DeviceId &&
                    d.UserId == userId
                );

            if (device == null)
            {
                return BadRequest(new
                {
                    message = "Device not found."
                });
            }

            var alert = new DeviceAlert
            {
                DeviceId = alertDto.DeviceId,
                AlertType = alertDto.AlertType,
                Message = alertDto.Message,
                CreatedAt = DateTime.Now,
                IsRead = false
            };

            _context.DeviceAlerts.Add(alert);

            await _context.SaveChangesAsync();

            return Ok(alert);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAlertAsRead(int id)
        {
            var userId = GetCurrentUserId();

            var alert = await _context.DeviceAlerts
                .Include(a => a.Device)
                .FirstOrDefaultAsync(a =>
                    a.AlertId == id &&
                    a.Device != null &&
                    a.Device.UserId == userId
                );

            if (alert == null)
            {
                return NotFound(new
                {
                    message = "Alert not found."
                });
            }

            alert.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Alert marked as read.",
                alertId = alert.AlertId,
                isRead = alert.IsRead
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeviceAlert(int id)
        {
            var userId = GetCurrentUserId();

            var alert = await _context.DeviceAlerts
                .Include(a => a.Device)
                .FirstOrDefaultAsync(a =>
                    a.AlertId == id &&
                    a.Device != null &&
                    a.Device.UserId == userId
                );

            if (alert == null)
            {
                return NotFound(new
                {
                    message = "Device alert not found."
                });
            }

            _context.DeviceAlerts.Remove(alert);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Device alert deleted successfully."
            });
        }
    }
}