using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Security.Claims;

namespace SmartHomeAutomation.Hubs
{
    [Authorize]
    public class DashboardHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DashboardHub> _logger;

        public DashboardHub(ApplicationDbContext context, ILogger<DashboardHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null) return;

                await Groups.AddToGroupAsync(Context.ConnectionId, $"dashboard_{userId.Value}");

                var role = Context.User?.FindFirstValue(ClaimTypes.Role);
                if (role == "Admin")
                    await Groups.AddToGroupAsync(Context.ConnectionId, "admin_dashboard");

                _logger.LogInformation("DashboardHub connected: User={UserId}", userId.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DashboardHub OnConnectedAsync error");
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            if (userId != null)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"dashboard_{userId.Value}");
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "admin_dashboard");
            }
        }

        public async Task RequestDashboardRefresh()
        {
            var userId = GetUserId();
            if (userId == null) return;
            await Clients.Group($"dashboard_{userId.Value}").SendAsync("DashboardRefreshRequested", new { userId });
        }

        private int? GetUserId()
        {
            var userIdClaim = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var userId))
                return userId;
            return null;
        }
    }
}
