using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DeviceHealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DeviceHealthController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!);
        }

        [HttpGet("my-devices")]
        public async Task<IActionResult> GetMyDevices()
        {
            var userId = GetCurrentUserId();

            var devices =
                await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.DeviceId,
                    d.Name,
                    d.Type,
                    d.Status,
                    d.PowerConsumption,
                    d.HealthScore,
                    d.TotalAnomalies,
                    d.LastHealthUpdated
                })
                .ToListAsync();

            return Ok(devices);
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("all-devices")]
        public async Task<IActionResult> GetAllDevices()
        {
            var devices =
                await _context.Devices
                .Include(d => d.User)
                .Select(d => new
                {
                    d.DeviceId,

                    d.Name,

                    d.Type,

                    d.Status,

                    d.PowerConsumption,

                    d.HealthScore,

                    d.TotalAnomalies,

                    User = d.User.FullName,

                    Email = d.User.Email
                })
                .ToListAsync();

            return Ok(devices);
        }

    }
}