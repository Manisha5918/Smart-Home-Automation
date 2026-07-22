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
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            int userId = GetCurrentUserId();

            var user = await _context.Users
                .Include(x => x.Devices)
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    !x.IsDeleted);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                user.UserId,
                user.FullName,
                user.Email,
                user.Role,

                user.CreatedAt,

                user.LastLoginAt,

                user.TotalUsageMinutes,

                DeviceCount =
                    user.Devices.Count,

                Online =
                    user.CurrentSessionStartedAt != null
            });
        }

        [HttpGet("devices")]
        public async Task<IActionResult> MyDevices()
        {
            int userId = GetCurrentUserId();

            var devices = await _context.Devices
                .Where(x => x.UserId == userId)
                .ToListAsync();

            return Ok(devices);
        }
        [HttpGet("notifications")]
        public async Task<IActionResult> MyNotifications()
        {
            int userId = GetCurrentUserId();

            var notifications = await _context.Notifications
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpGet("login-history")]
        public async Task<IActionResult> LoginHistory()
        {
            int userId = GetCurrentUserId();

            var history = await _context.LoginHistories
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.AttemptedAt)
                .ToListAsync();

            return Ok(history);
        }

    }

}