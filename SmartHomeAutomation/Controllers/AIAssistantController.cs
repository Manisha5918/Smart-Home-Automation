using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.Services;
using System.Security.Claims;
using System.Text.Json;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AIAssistantController : ControllerBase
    {
        private readonly AIAssistantService _assistantService;
        private readonly MemoryService _memoryService;
        private readonly AIExplainabilityService _explainService;
        private readonly IRealTimeNotificationService _notificationService;

        public AIAssistantController(
            AIAssistantService assistantService,
            MemoryService memoryService,
            AIExplainabilityService explainService,
            IRealTimeNotificationService notificationService)
        {
            _assistantService = assistantService;
            _memoryService = memoryService;
            _explainService = explainService;
            _notificationService = notificationService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new { message = "Message is required." });

            try
            {
                var response = await _assistantService.ChatAsync(GetUserId(), request.Message);
                return Ok(new { response });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "AI service is unavailable.", error = ex.Message });
            }
        }

        [HttpPost("stream")]
        public async Task StreamChat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("data: {\"error\":\"Message is required\"}\n\n");
                return;
            }

            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");

            try
            {
                var userId = GetUserId();
                await foreach (var chunk in _assistantService.StreamChatAsync(userId, request.Message))
                {
                    var escaped = JsonSerializer.Serialize(chunk);
                    await Response.WriteAsync($"data: {escaped}\n\n");
                    await Response.Body.FlushAsync();
                }
                await Response.WriteAsync("data: [DONE]\n\n");
                await Response.Body.FlushAsync();
            }
            catch
            {
                await Response.WriteAsync("data: {\"error\":\"AI service unavailable\"}\n\n");
                await Response.Body.FlushAsync();
            }
        }

        [HttpPost("command")]
        public async Task<IActionResult> ExecuteCommand([FromBody] CommandRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Command))
                return BadRequest(new { message = "Command is required." });

            try
            {
                var result = await _assistantService.ExecuteCommandAsync(GetUserId(), request.Command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Command execution failed.", error = ex.Message });
            }
        }

        [HttpPost("explain")]
        public async Task<IActionResult> Explain([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new { message = "Question is required." });

            try
            {
                var response = await _explainService.ExplainAsync(GetUserId(), request.Message);
                return Ok(new { response });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Explainability service unavailable.", error = ex.Message });
            }
        }

        [HttpPost("report")]
        public async Task<IActionResult> GenerateReport([FromBody] ReportRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Type))
                return BadRequest(new { message = "Report type is required." });

            try
            {
                var report = await _assistantService.GenerateReportAsync(GetUserId(), request.Type);
                return Ok(new { type = request.Type, report, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Report generation failed.", error = ex.Message });
            }
        }

        [HttpGet("context")]
        public async Task<IActionResult> GetContext()
        {
            try
            {
                var context = await _assistantService.BuildContextAsync(GetUserId());
                return Ok(JsonSerializer.Deserialize<object>(context));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to build context.", error = ex.Message });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearConversation()
        {
            await _memoryService.ClearConversationAsync(GetUserId());
            return Ok(new { message = "Conversation cleared." });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var history = await _memoryService.GetConversationHistoryAsync(GetUserId(), 50);
            return Ok(new { history });
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = "";
    }

    public class CommandRequest
    {
        public string Command { get; set; } = "";
    }

    public class ReportRequest
    {
        public string Type { get; set; } = "";
    }
}
