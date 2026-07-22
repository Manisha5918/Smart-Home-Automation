using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PredictiveMaintenanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private readonly PredictiveMaintenanceService
            _predictiveMaintenanceService;

        public PredictiveMaintenanceController(
            ApplicationDbContext context,
            PredictiveMaintenanceService predictiveMaintenanceService)
        {
            _context = context;
            _predictiveMaintenanceService =
                predictiveMaintenanceService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!);
        }
        [HttpGet("my-devices")]
        public async Task<IActionResult> GetMyPredictions()
        {
            var userId = GetCurrentUserId();

            var devices =
                await _context.Devices
                    .Where(d => d.UserId == userId)
                    .ToListAsync();

            var result = new List<object>();

            foreach (var device in devices)
            {
                var prediction =
                    await _predictiveMaintenanceService
                        .PredictMaintenanceAsync(device);

                result.Add(prediction);
            }

            return Ok(result);
        }
        [Authorize(Roles = "Admin")]
        [HttpGet("all-devices")]
        public async Task<IActionResult> GetAllPredictions()
        {
            var devices =
                await _context.Devices
                    .Include(d => d.User)
                    .ToListAsync();

            var result = new List<object>();

            foreach (var device in devices)
            {
                var prediction =
                    await _predictiveMaintenanceService
                        .PredictMaintenanceAsync(device);

                result.Add(new
                {
                    User = device.User?.FullName,
                    Email = device.User?.Email,
                    prediction
                });
            }

            return Ok(result);
        }

    }
}