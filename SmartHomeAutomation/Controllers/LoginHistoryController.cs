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
    public class LoginHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LoginHistoryController(
            ApplicationDbContext context)
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
        public async Task<IActionResult> GetLoginHistory()
        {
            var userId = GetCurrentUserId();

            var loginHistory = await _context.LoginHistories
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.AttemptedAt)
                .Select(l => new
                {
                    l.LoginHistoryId,
                    l.Email,
                    l.IsSuccessful,
                    l.IpAddress,
                    l.AttemptedAt
                })
                .ToListAsync();

            return Ok(loginHistory);
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentLoginHistory()
        {
            var userId = GetCurrentUserId();

            var loginHistory = await _context.LoginHistories
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.AttemptedAt)
                .Take(10)
                .Select(l => new
                {
                    l.LoginHistoryId,
                    l.Email,
                    l.IsSuccessful,
                    l.IpAddress,
                    l.AttemptedAt
                })
                .ToListAsync();

            return Ok(loginHistory);
        }
    }
}