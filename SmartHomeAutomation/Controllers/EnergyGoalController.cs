using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EnergyGoalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EnergyGoalController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpPost]
        public async Task<IActionResult> SetGoal(EnergyGoal goal)
        {
            var userId = GetCurrentUserId();

            var existingGoal = await _context.EnergyGoals
                .FirstOrDefaultAsync(g => g.UserId == userId);

            if (existingGoal != null)
            {
                existingGoal.MonthlyGoal = goal.MonthlyGoal;
                existingGoal.CreatedAt = DateTime.Now;
            }
            else
            {
                goal.UserId = userId;
                goal.CreatedAt = DateTime.Now;

                _context.EnergyGoals.Add(goal);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Monthly energy goal saved successfully."
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetGoal()
        {
            var userId = GetCurrentUserId();

            var goal = await _context.EnergyGoals
                .FirstOrDefaultAsync(g => g.UserId == userId);

            if (goal == null)
            {
                return NotFound(new
                {
                    message = "Energy goal not set."
                });
            }

            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;

            var currentUsage = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == currentMonth &&
                    e.RecordedAt.Year == currentYear)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            var remaining = goal.MonthlyGoal - currentUsage;

            if (remaining < 0)
                remaining = 0;

            var progress = goal.MonthlyGoal == 0
                ? 0
                : (currentUsage / goal.MonthlyGoal) * 100;

            return Ok(new
            {
                monthlyGoal = $"{goal.MonthlyGoal:F2} kWh",
                currentUsage = $"{currentUsage:F2} kWh",
                remaining = $"{remaining:F2} kWh",
                progress = $"{progress:F2}%"
            });
        }
    }
}