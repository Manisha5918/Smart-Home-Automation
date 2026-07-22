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
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IRealTimeNotificationService _realtimeService;

        public NotificationController(ApplicationDbContext context, IRealTimeNotificationService realtimeService)
        {
            _context = context;
            _realtimeService = realtimeService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = GetCurrentUserId();

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNotification(int id)
        {
            var userId = GetCurrentUserId();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == id &&
                    n.UserId == userId
                );

            if (notification == null)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            return Ok(notification);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification(
            CreateNotificationDto notificationDto)
        {
            var userId = GetCurrentUserId();

            var notification = new Notification
            {
                UserId = userId,
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyNewNotificationAsync(userId, notification);

            return Ok(notification);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetCurrentUserId();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == id &&
                    n.UserId == userId
                );

            if (notification == null)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Notification marked as read.",
                notificationId = notification.NotificationId,
                isRead = notification.IsRead
            });
        }




        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadNotificationCount()
        {
            var userId = GetCurrentUserId();

            var count = await _context.Notifications
                .CountAsync(n =>
                    n.UserId == userId &&
                    !n.IsRead
                );

            return Ok(new
            {
                unreadCount = count
            });
        }






        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var userId = GetCurrentUserId();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == id &&
                    n.UserId == userId
                );

            if (notification == null)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            _context.Notifications.Remove(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Notification deleted successfully."
            });
        }
    }
}