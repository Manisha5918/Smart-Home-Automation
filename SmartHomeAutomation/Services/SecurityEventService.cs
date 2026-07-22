using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class SecurityEventService
    {
        private readonly ApplicationDbContext _context;

        public SecurityEventService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogEventAsync(
            int? userId,
            string eventType,
            string description,
            string? ipAddress = null,
            string? userAgent = null)
        {
            var securityEvent = new SecurityEvent
            {
                UserId = userId,
                EventType = eventType,
                Description = description,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                CreatedAt = DateTime.Now
            };

            _context.SecurityEvents.Add(securityEvent);
            await _context.SaveChangesAsync();
        }

        public async Task LogActivityAsync(
            int userId,
            string action,
            string description)
        {
            var activityLog = new ActivityLog
            {
                UserId = userId,
                Action = action,
                Description = description,
                CreatedAt = DateTime.Now
            };

            _context.ActivityLogs.Add(activityLog);
            await _context.SaveChangesAsync();
        }
    }
}
