using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.Services;
using System.Text.Json;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportController : ControllerBase
    {
        private readonly ReportGenerationService _reportService;

        public ReportController(ReportGenerationService reportService)
        {
            _reportService = reportService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] ReportGenerateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Type))
                return BadRequest(new { message = "Report type is required. Valid types: daily, weekly, monthly, energy, device, security, automation" });

            var validTypes = new[] { "daily", "weekly", "monthly", "energy", "device", "device health", "security", "automation" };
            var type = request.Type.ToLower();
            if (!validTypes.Contains(type))
                return BadRequest(new { message = $"Invalid report type. Valid types: {string.Join(", ", validTypes)}" });

            try
            {
                var report = await _reportService.GenerateAsync(GetUserId(), type);

                return Ok(new { type, report, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Report generation failed.", error = ex.Message });
            }
        }

        [HttpGet("types")]
        public IActionResult GetReportTypes()
        {
            return Ok(new
            {
                types = new[]
                {
                    new { id = "daily", name = "Daily Report", description = "Overview of today's activity and energy usage", icon = "calendar" },
                    new { id = "weekly", name = "Weekly Report", description = "Weekly trends, comparisons, and insights", icon = "calendar" },
                    new { id = "monthly", name = "Monthly Report", description = "Comprehensive monthly analysis with projections", icon = "calendar" },
                    new { id = "energy", name = "Energy Report", description = "Detailed energy consumption analysis with top consumers", icon = "zap" },
                    new { id = "device", name = "Device Health Report", description = "Device status, health scores, and maintenance needs", icon = "cpu" },
                    new { id = "security", name = "Security Report", description = "Security events, failed logins, and risk assessment", icon = "shield" },
                    new { id = "automation", name = "Automation Report", description = "Automation rules, triggers, and execution history", icon = "bot" }
                }
            });
        }
    }

    public class ReportGenerateRequest
    {
        public string Type { get; set; } = "";
    }
}
