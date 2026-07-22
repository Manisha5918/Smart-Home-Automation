using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VoiceController : ControllerBase
    {
        private readonly CommandParserService _commandParserService;

        public VoiceController(CommandParserService commandParserService)
        {
            _commandParserService = commandParserService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.Parse(userId!);
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessVoiceCommand(VoiceCommandDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Text))
            {
                return BadRequest(new { message = "Voice text is required." });
            }

            var userId = GetCurrentUserId();

            try
            {
                var result = await _commandParserService.ProcessCommandAsync(userId, dto.Text);
                return Ok(result);
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new VoiceResponseDto
                {
                    Success = false,
                    Action = "error",
                    SpokenResponse = "I'm having trouble connecting to my AI service. Please try again later."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new VoiceResponseDto
                {
                    Success = false,
                    Action = "error",
                    SpokenResponse = "An unexpected error occurred. Please try again.",
                    Data = new { error = ex.Message }
                });
            }
        }
    }
}
