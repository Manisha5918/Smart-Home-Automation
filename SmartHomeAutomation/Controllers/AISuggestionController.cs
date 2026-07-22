using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AISuggestionController : ControllerBase
    {
        private readonly AISuggestionService _suggestionService;

        private readonly ApplicationDbContext _context;


        public AISuggestionController(
            AISuggestionService suggestionService,
            ApplicationDbContext context)
        {
            _suggestionService = suggestionService;

            _context = context;
        }


        private int GetCurrentUserId()
        {
            var userId =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }


        [HttpPost("generate")]
        public async Task<IActionResult> GenerateSuggestions()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            bool isAdmin = user?.Role == "Admin";

            await _suggestionService
                .GenerateSuggestionsAsync(isAdmin ? null : userId);


            return Ok(new
            {
                message =
                "AI suggestions generated successfully."
            });
        }


        // GET AI Suggestions
        [HttpGet]
        public async Task<IActionResult> GetSuggestions()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            bool isAdmin = user?.Role == "Admin";

            var suggestions =
                await _suggestionService
                    .GetSuggestionsAsync(isAdmin ? null : userId);


            return Ok(suggestions);
        }



        // ACCEPT AI SUGGESTION
        // Converts suggestion into Automation Rule
        [HttpPost("{id}/accept")]
        public async Task<IActionResult> AcceptSuggestion(
            int id)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            bool isAdmin = user?.Role == "Admin";

            var suggestion =
                await _context.AISuggestions
                .FirstOrDefaultAsync(x =>
                    x.SuggestionId == id &&
                    (isAdmin || x.UserId == userId));



            if (suggestion == null)
            {
                return NotFound(new
                {
                    message =
                    "Suggestion not found."
                });
            }



            if (suggestion.IsAccepted)
            {
                return BadRequest(new
                {
                    message =
                    "Suggestion already accepted."
                });
            }



            var automationRule =
                new AutomationRule
                {
                    DeviceId =
                    suggestion.DeviceId,


                    RuleName =
                    "AI Generated Automation",


                    TriggerType =
                    suggestion.TriggerType,


                    TriggerValue =
                    suggestion.TriggerValue,


                    Action =
                    suggestion.Action,


                    IsActive = true,


                    CreatedAt =
                    DateTime.Now
                };



            _context.AutomationRules
                .Add(automationRule);



            suggestion.IsAccepted = true;



            await _context.SaveChangesAsync();



            return Ok(new
            {
                message =
                "AI suggestion converted into automation rule.",


                ruleId =
                automationRule.RuleId,


                deviceId =
                automationRule.DeviceId,


                triggerType =
                automationRule.TriggerType,


                triggerValue =
                automationRule.TriggerValue,


                action =
                automationRule.Action
            });
        }
    }
}