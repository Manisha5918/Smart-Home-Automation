using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AIExplainabilityController : ControllerBase
    {
        private readonly AIExplainabilityService _explainabilityService;

        public AIExplainabilityController(AIExplainabilityService explainabilityService)
        {
            _explainabilityService = explainabilityService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.Parse(userId!);
        }

        [HttpPost("query")]
        public async Task<IActionResult> Query([FromBody] ExplainRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message is required." });
            }

            try
            {
                var userId = GetCurrentUserId();
                var explanation = await _explainabilityService.ExplainAsync(userId, request.Message);
                return Ok(new { response = explanation });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new
                {
                    message = "Smart Insights AI service is currently unavailable.",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearHistory()
        {
            try
            {
                var userId = GetCurrentUserId();
                await _explainabilityService.ClearExplanationHistoryAsync(userId);
                return Ok(new { message = "Insights history cleared successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to clear insights history.", error = ex.Message });
            }
        }
    }

    public class ExplainRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}
