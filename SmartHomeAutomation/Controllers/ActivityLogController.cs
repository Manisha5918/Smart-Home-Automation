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
    public class ActivityLogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IRealTimeNotificationService _realtimeService;

        public ActivityLogController(ApplicationDbContext context, IRealTimeNotificationService realtimeService)
        {
            _context = context;
            _realtimeService = realtimeService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetActivityLogs()
        {
            var userId = GetCurrentUserId();

            var activityLogs = await _context.ActivityLogs
                .Where(a => a.UserId == userId)
                .Include(a => a.Device)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(activityLogs);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetActivityLog(int id)
        {
            var userId = GetCurrentUserId();

            var activityLog = await _context.ActivityLogs
                .Include(a => a.Device)
                .FirstOrDefaultAsync(a =>
                    a.ActivityLogId == id &&
                    a.UserId == userId
                );

            if (activityLog == null)
            {
                return NotFound(new
                {
                    message = "Activity log not found."
                });
            }

            return Ok(activityLog);
        }

        [HttpPost]
        public async Task<IActionResult> CreateActivityLog(
            CreateActivityLogDto activityLogDto)
        {
            var userId = GetCurrentUserId();

            if (activityLogDto.DeviceId.HasValue)
            {
                var deviceExists = await _context.Devices
                    .AnyAsync(d =>
                        d.DeviceId == activityLogDto.DeviceId.Value &&
                        d.UserId == userId
                    );

                if (!deviceExists)
                {
                    return BadRequest(new
                    {
                        message = "Device not found."
                    });
                }
            }

            var activityLog = new ActivityLog
            {
                UserId = userId,
                DeviceId = activityLogDto.DeviceId,
                Action = activityLogDto.Action,
                Description = activityLogDto.Description,
                CreatedAt = DateTime.Now
            };

            _context.ActivityLogs.Add(activityLog);

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyNewActivityAsync(userId, activityLog);

            return Ok(activityLog);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteActivityLog(int id)
        {
            var userId = GetCurrentUserId();

            var activityLog = await _context.ActivityLogs
                .FirstOrDefaultAsync(a =>
                    a.ActivityLogId == id &&
                    a.UserId == userId
                );

            if (activityLog == null)
            {
                return NotFound(new
                {
                    message = "Activity log not found."
                });
            }

            _context.ActivityLogs.Remove(activityLog);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Activity log deleted successfully."
            });
        }
    }
}