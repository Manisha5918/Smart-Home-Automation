using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;

namespace SmartHomeAutomation.Services
{
    public class SecurityRiskService
    {
        private readonly ApplicationDbContext _context;

        public SecurityRiskService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SecurityRiskResultDto>
            CalculateUserRiskAsync(int userId)
        {
            var since = DateTime.Now.AddHours(-24);

            var loginHistory = await _context.LoginHistories
                .Where(l =>
                    l.UserId == userId &&
                    l.AttemptedAt >= since)
                .OrderBy(l => l.AttemptedAt)
                .ToListAsync();

            int riskScore = 0;

            var riskFactors = new List<string>();

            var failedLogins = loginHistory
                .Where(l => !l.IsSuccessful)
                .ToList();

            int failedLoginCount = failedLogins.Count;

            if (failedLoginCount >= 5)
            {
                riskScore += 40;

                riskFactors.Add(
                    "Multiple failed login attempts detected.");
            }
            else if (failedLoginCount >= 3)
            {
                riskScore += 25;

                riskFactors.Add(
                    "Several failed login attempts detected.");
            }
            else if (failedLoginCount > 0)
            {
                riskScore += 10;

                riskFactors.Add(
                    "Failed login attempts detected.");
            }

            var uniqueIpAddresses = loginHistory
                .Where(l =>
                    !string.IsNullOrWhiteSpace(l.IpAddress))
                .Select(l => l.IpAddress)
                .Distinct()
                .Count();

            if (uniqueIpAddresses >= 4)
            {
                riskScore += 25;

                riskFactors.Add(
                    "Login activity detected from multiple IP addresses.");
            }
            else if (uniqueIpAddresses >= 2)
            {
                riskScore += 15;

                riskFactors.Add(
                    "Login activity detected from different IP addresses.");
            }

            var unusualHourAttempts = loginHistory
                .Where(l =>
                    l.AttemptedAt.Hour >= 0 &&
                    l.AttemptedAt.Hour < 5)
                .ToList();

            if (unusualHourAttempts.Count >= 3)
            {
                riskScore += 20;

                riskFactors.Add(
                    "Multiple login attempts occurred during unusual hours.");
            }
            else if (unusualHourAttempts.Count > 0)
            {
                riskScore += 10;

                riskFactors.Add(
                    "Login activity occurred during unusual hours.");
            }

            bool rapidAttemptsDetected = false;

            for (int i = 1;
                 i < failedLogins.Count;
                 i++)
            {
                var difference =
                    failedLogins[i].AttemptedAt -
                    failedLogins[i - 1].AttemptedAt;

                if (difference.TotalSeconds <= 30)
                {
                    rapidAttemptsDetected = true;

                    break;
                }
            }

            if (rapidAttemptsDetected)
            {
                riskScore += 15;

                riskFactors.Add(
                    "Rapid consecutive failed login attempts detected.");
            }

            riskScore = Math.Min(riskScore, 100);

            string riskLevel;

            if (riskScore >= 80)
            {
                riskLevel = "Critical";
            }
            else if (riskScore >= 60)
            {
                riskLevel = "High";
            }
            else if (riskScore >= 30)
            {
                riskLevel = "Medium";
            }
            else
            {
                riskLevel = "Low";
            }

            if (riskFactors.Count == 0)
            {
                riskFactors.Add(
                    "No significant login security risks detected.");
            }

            return new SecurityRiskResultDto
            {
                RiskScore = riskScore,

                RiskLevel = riskLevel,

                FailedLoginAttempts =
                    failedLoginCount,

                UniqueIpAddresses =
                    uniqueIpAddresses,

                UnusualHourAttempts =
                    unusualHourAttempts.Count,

                RapidAttemptsDetected =
                    rapidAttemptsDetected,

                RiskFactors = riskFactors
            };
        }
    }
}