using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SecurityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private readonly SecurityRiskService
            _securityRiskService;

        public SecurityController(
            ApplicationDbContext context,
            SecurityRiskService securityRiskService)
        {
            _context = context;

            _securityRiskService =
                securityRiskService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }

        [HttpGet("risk")]
        public async Task<IActionResult>
            GetSecurityRisk()
        {
            var userId = GetCurrentUserId();

            var risk =
                await _securityRiskService
                    .CalculateUserRiskAsync(userId);

            return Ok(risk);
        }

        [HttpGet("login-activity")]
        public async Task<IActionResult>
            GetLoginActivity()
        {
            var userId = GetCurrentUserId();

            var loginActivity =
                await _context.LoginHistories
                    .Where(l =>
                        l.UserId == userId)
                    .OrderByDescending(
                        l => l.AttemptedAt)
                    .Take(20)
                    .Select(l => new
                    {
                        l.LoginHistoryId,

                        l.Email,

                        l.IsSuccessful,

                        l.IpAddress,

                        l.AttemptedAt
                    })
                    .ToListAsync();

            return Ok(loginActivity);
        }

        [HttpGet("summary")]
        public async Task<IActionResult>
            GetSecuritySummary()
        {
            var userId = GetCurrentUserId();

            var since =
                DateTime.Now.AddHours(-24);

            var loginHistory =
                await _context.LoginHistories
                    .Where(l =>
                        l.UserId == userId &&
                        l.AttemptedAt >= since)
                    .ToListAsync();

            var risk =
                await _securityRiskService
                    .CalculateUserRiskAsync(userId);

            var successfulLogins =
                loginHistory.Count(
                    l => l.IsSuccessful);

            var failedLogins =
                loginHistory.Count(
                    l => !l.IsSuccessful);

            var lastSuccessfulLogin =
                loginHistory
                    .Where(l => l.IsSuccessful)
                    .OrderByDescending(
                        l => l.AttemptedAt)
                    .Select(l =>
                        (DateTime?)l.AttemptedAt)
                    .FirstOrDefault();

            return Ok(new
            {
                period = "Last 24 hours",

                successfulLogins,

                failedLogins,

                lastSuccessfulLogin,

                riskScore = risk.RiskScore,

                riskLevel = risk.RiskLevel,

                riskFactors = risk.RiskFactors
            });
        }
    }
}