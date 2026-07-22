using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Models;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AutomationRuleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AutomationRuleController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetAutomationRules()
        {
            var userId = GetCurrentUserId();

            var rules = await _context.AutomationRules
                .Include(r => r.Device)
                .Where(r =>
                    r.Device != null &&
                    r.Device.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.RuleId,
                    r.DeviceId,
                    DeviceName = r.Device!.Name,
                    r.RuleName,
                    r.TriggerType,
                    r.TriggerValue,
                    r.Action,
                    r.IsActive,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(rules);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAutomationRule(
            int id)
        {
            var userId = GetCurrentUserId();

            var rule = await _context.AutomationRules
                .Include(r => r.Device)
                .Where(r =>
                    r.RuleId == id &&
                    r.Device != null &&
                    r.Device.UserId == userId)
                .Select(r => new
                {
                    r.RuleId,
                    r.DeviceId,
                    DeviceName = r.Device!.Name,
                    r.RuleName,
                    r.TriggerType,
                    r.TriggerValue,
                    r.Action,
                    r.IsActive,
                    r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (rule == null)
            {
                return NotFound(new
                {
                    message =
                        "Automation rule not found."
                });
            }

            return Ok(rule);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAutomationRule(
            CreateAutomationRuleDto ruleDto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(
                ruleDto.RuleName))
            {
                return BadRequest(new
                {
                    message = "Rule name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                ruleDto.TriggerType))
            {
                return BadRequest(new
                {
                    message =
                        "Trigger type is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                ruleDto.TriggerValue))
            {
                return BadRequest(new
                {
                    message =
                        "Trigger value is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                ruleDto.Action))
            {
                return BadRequest(new
                {
                    message = "Action is required."
                });
            }

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == ruleDto.DeviceId &&
                    d.UserId == userId);

            if (device == null)
            {
                return BadRequest(new
                {
                    message = "Device not found."
                });
            }

            var duplicateRule =
                await _context.AutomationRules
                    .AnyAsync(r =>
                        r.DeviceId == ruleDto.DeviceId &&
                        r.TriggerType ==
                            ruleDto.TriggerType &&
                        r.TriggerValue ==
                            ruleDto.TriggerValue &&
                        r.Action == ruleDto.Action);

            if (duplicateRule)
            {
                return BadRequest(new
                {
                    message =
                        "A similar automation rule already exists."
                });
            }

            var rule = new AutomationRule
            {
                DeviceId = ruleDto.DeviceId,

                RuleName = ruleDto.RuleName.Trim(),

                TriggerType =
                    ruleDto.TriggerType.Trim(),

                TriggerValue =
                    ruleDto.TriggerValue.Trim(),

                Action = ruleDto.Action.Trim(),

                IsActive = true,

                CreatedAt = DateTime.Now
            };

            _context.AutomationRules.Add(rule);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Automation rule created successfully.",

                ruleId = rule.RuleId,

                deviceId = rule.DeviceId,

                deviceName = device.Name,

                ruleName = rule.RuleName,

                triggerType = rule.TriggerType,

                triggerValue = rule.TriggerValue,

                action = rule.Action,

                isActive = rule.IsActive
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAutomationRule(
            int id,
            CreateAutomationRuleDto ruleDto)
        {
            var userId = GetCurrentUserId();

            var rule = await _context.AutomationRules
                .Include(r => r.Device)
                .FirstOrDefaultAsync(r =>
                    r.RuleId == id &&
                    r.Device != null &&
                    r.Device.UserId == userId);

            if (rule == null)
            {
                return NotFound(new
                {
                    message =
                        "Automation rule not found."
                });
            }

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == ruleDto.DeviceId &&
                    d.UserId == userId);

            if (device == null)
            {
                return BadRequest(new
                {
                    message = "Device not found."
                });
            }

            if (string.IsNullOrWhiteSpace(
                ruleDto.RuleName))
            {
                return BadRequest(new
                {
                    message = "Rule name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                ruleDto.TriggerType))
            {
                return BadRequest(new
                {
                    message =
                        "Trigger type is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                ruleDto.TriggerValue))
            {
                return BadRequest(new
                {
                    message =
                        "Trigger value is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                ruleDto.Action))
            {
                return BadRequest(new
                {
                    message = "Action is required."
                });
            }

            var duplicateRule =
                await _context.AutomationRules
                    .AnyAsync(r =>
                        r.RuleId != id &&
                        r.DeviceId == ruleDto.DeviceId &&
                        r.TriggerType ==
                            ruleDto.TriggerType &&
                        r.TriggerValue ==
                            ruleDto.TriggerValue &&
                        r.Action == ruleDto.Action);

            if (duplicateRule)
            {
                return BadRequest(new
                {
                    message =
                        "A similar automation rule already exists."
                });
            }

            rule.DeviceId = ruleDto.DeviceId;

            rule.RuleName = ruleDto.RuleName.Trim();

            rule.TriggerType =
                ruleDto.TriggerType.Trim();

            rule.TriggerValue =
                ruleDto.TriggerValue.Trim();

            rule.Action = ruleDto.Action.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Automation rule updated successfully.",

                ruleId = rule.RuleId,

                deviceId = rule.DeviceId,

                deviceName = device.Name,

                ruleName = rule.RuleName,

                triggerType = rule.TriggerType,

                triggerValue = rule.TriggerValue,

                action = rule.Action,

                isActive = rule.IsActive
            });
        }

        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleAutomationRule(
            int id)
        {
            var userId = GetCurrentUserId();

            var rule = await _context.AutomationRules
                .Include(r => r.Device)
                .FirstOrDefaultAsync(r =>
                    r.RuleId == id &&
                    r.Device != null &&
                    r.Device.UserId == userId);

            if (rule == null)
            {
                return NotFound(new
                {
                    message =
                        "Automation rule not found."
                });
            }

            rule.IsActive = !rule.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = rule.IsActive
                    ? "Automation rule enabled."
                    : "Automation rule disabled.",

                ruleId = rule.RuleId,

                isActive = rule.IsActive
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAutomationRule(
            int id)
        {
            var userId = GetCurrentUserId();

            var rule = await _context.AutomationRules
                .Include(r => r.Device)
                .FirstOrDefaultAsync(r =>
                    r.RuleId == id &&
                    r.Device != null &&
                    r.Device.UserId == userId);

            if (rule == null)
            {
                return NotFound(new
                {
                    message =
                        "Automation rule not found."
                });
            }

            _context.AutomationRules.Remove(rule);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Automation rule deleted successfully."
            });
        }
    }
}