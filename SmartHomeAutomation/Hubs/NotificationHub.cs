using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace SmartHomeAutomation.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private static readonly ConcurrentDictionary<string, UserConnection> ConnectedUsers = new();
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ApplicationDbContext context, ILogger<NotificationHub> logger)
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

                var connectionId = Context.ConnectionId;
                var role = Context.User?.FindFirstValue(ClaimTypes.Role) ?? "User";

                ConnectedUsers.AddOrUpdate(connectionId, new UserConnection
                {
                    UserId = userId.Value,
                    ConnectionId = connectionId,
                    Role = role,
                    ConnectedAt = DateTime.UtcNow
                }, (key, old) => old);

                await Groups.AddToGroupAsync(connectionId, $"user_{userId.Value}");
                if (role == "Admin")
                    await Groups.AddToGroupAsync(connectionId, "admins");

                await Clients.Group($"user_{userId.Value}").SendAsync("UserPresence", new
                {
                    userId = userId.Value,
                    status = "online",
                    connectionId
                });

                _logger.LogInformation("SignalR connected: User={UserId}, Connection={ConnectionId}", userId.Value, connectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR OnConnectedAsync error");
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                var userId = GetUserId();
                var connectionId = Context.ConnectionId;

                ConnectedUsers.TryRemove(connectionId, out _);

                if (userId != null)
                {
                    await Groups.RemoveFromGroupAsync(connectionId, $"user_{userId.Value}");
                    var stillConnected = ConnectedUsers.Values.Any(u => u.UserId == userId.Value);
                    if (!stillConnected)
                    {
                        await Clients.Group($"user_{userId.Value}").SendAsync("UserPresence", new
                        {
                            userId = userId.Value,
                            status = "offline",
                            lastSeen = DateTime.UtcNow
                        });
                    }
                }

                _logger.LogInformation("SignalR disconnected: User={UserId}, Connection={ConnectionId}", userId, connectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR OnDisconnectedAsync error");
            }
        }

        public static int GetOnlineUserCount()
        {
            return ConnectedUsers.Values.Select(u => u.UserId).Distinct().Count();
        }

        public static List<UserConnection> GetActiveConnections()
        {
            return ConnectedUsers.Values.ToList();
        }

        public static List<int> GetOnlineUserIds()
        {
            return ConnectedUsers.Values.Select(u => u.UserId).Distinct().ToList();
        }

        private int? GetUserId()
        {
            var userIdClaim = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var userId))
                return userId;
            return null;
        }
    }

    public class UserConnection
    {
        public int UserId { get; set; }
        public string ConnectionId { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public DateTime ConnectedAt { get; set; }
    }
}
