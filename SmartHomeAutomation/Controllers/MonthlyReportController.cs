using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MonthlyReportController : ControllerBase
    {
        private readonly MonthlyReportService _monthlyReportService;

        public MonthlyReportController(MonthlyReportService monthlyReportService)
        {
            _monthlyReportService = monthlyReportService;
        }

        [HttpGet]
        public async Task<ActionResult<MonthlyReportDto>> GetMonthlyReport()
        {
            // Try standard NameIdentifier first, fallback to UserId claim
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var report = await _monthlyReportService.GetMonthlyReportAsync(userId);
            return Ok(report);
        }
    }
}