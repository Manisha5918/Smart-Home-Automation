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
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpGet("monthly")]
        public async Task<IActionResult> MonthlyReport()
        {
            var userId = GetCurrentUserId();

            var month = DateTime.Now.Month;
            var year = DateTime.Now.Year;

            var usages = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == month &&
                    e.RecordedAt.Year == year)
                .ToListAsync();

            if (!usages.Any())
            {
                return NotFound(new
                {
                    message = "No energy data found."
                });
            }

            double totalEnergy =
                usages.Sum(x => x.PowerConsumption);

            double bill =
                totalEnergy * 8;

            double co2 =
                totalEnergy * 0.82;

            var mostUsed =
                usages
                .GroupBy(x => x.Device!.Name)
                .Select(g => new
                {
                    Device = g.Key,
                    Usage = g.Sum(x => x.PowerConsumption)
                })
                .OrderByDescending(x => x.Usage)
                .First();

            var bestDay =
                usages
                .GroupBy(x => x.RecordedAt.DayOfWeek)
                .OrderBy(g => g.Sum(x => x.PowerConsumption))
                .First()
                .Key;

            string rating;

            if (totalEnergy < 100)
                rating = "A+";
            else if (totalEnergy < 200)
                rating = "A";
            else if (totalEnergy < 300)
                rating = "B+";
            else if (totalEnergy < 400)
                rating = "B";
            else
                rating = "C";

            return Ok(new
            {
                month = DateTime.Now.ToString("MMMM"),

                energyUsed =
                    $"{totalEnergy:F2} kWh",

                electricityBill =
                    $"₹{bill:F2}",

                co2Produced =
                    $"{co2:F2} kg",

                mostUsedDevice =
                    mostUsed.Device,

                bestSavingDay =
                    bestDay.ToString(),

                overallHomeRating =
                    rating
            });
        }
    }
}