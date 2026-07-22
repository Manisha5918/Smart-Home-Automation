using Microsoft.AspNetCore.SignalR;
using SmartHomeAutomation.Hubs;

namespace SmartHomeAutomation.Services
{
    public class RealTimeNotificationService : IRealTimeNotificationService
    {
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly IHubContext<DashboardHub> _dashboardHub;
        private readonly ILogger<RealTimeNotificationService> _logger;

        public RealTimeNotificationService(
            IHubContext<NotificationHub> notificationHub,
            IHubContext<DashboardHub> dashboardHub,
            ILogger<RealTimeNotificationService> logger)
        {
            _notificationHub = notificationHub;
            _dashboardHub = dashboardHub;
            _logger = logger;
        }

        public async Task NotifyUserAsync(int userId, string method, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync(method, data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR NotifyUser {Method} failed for User={UserId}", method, userId);
            }
        }

        public async Task NotifyAllAsync(string method, object data)
        {
            try
            {
                await _notificationHub.Clients.All.SendAsync(method, data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR NotifyAll {Method} failed", method);
            }
        }

        public async Task NotifyAdminsAsync(string method, object data)
        {
            try
            {
                await _notificationHub.Clients.Group("admins").SendAsync(method, data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR NotifyAdmins {Method} failed", method);
            }
        }

        public async Task NotifyDashboardUpdateAsync(int userId, object data)
        {
            try
            {
                await _dashboardHub.Clients.Group($"dashboard_{userId}").SendAsync("DashboardUpdated", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR DashboardUpdate failed for User={UserId}", userId);
            }
        }

        public async Task NotifyDeviceStatusChangedAsync(int userId, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("DeviceStatusChanged", data);
                await _dashboardHub.Clients.Group($"dashboard_{userId}").SendAsync("DashboardUpdated", new { type = "device_status", data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR DeviceStatusChanged failed for User={UserId}", userId);
            }
        }

        public async Task NotifyNewNotificationAsync(int userId, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("NewNotification", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR NewNotification failed for User={UserId}", userId);
            }
        }

        public async Task NotifyNewActivityAsync(int userId, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("NewActivity", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR NewActivity failed for User={UserId}", userId);
            }
        }

        public async Task NotifyEnergyUpdateAsync(int userId, object data)
        {
            try
            {
                await _dashboardHub.Clients.Group($"dashboard_{userId}").SendAsync("EnergyUpdated", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR EnergyUpdate failed for User={UserId}", userId);
            }
        }

        public async Task NotifySecurityAlertAsync(int userId, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("SecurityAlert", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR SecurityAlert failed for User={UserId}", userId);
            }
        }

        public async Task NotifyAIChatCompletedAsync(int userId, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("AIChatCompleted", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR AIChatCompleted failed for User={UserId}", userId);
            }
        }

        public async Task NotifyAutomationExecutedAsync(int userId, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("AutomationExecuted", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR AutomationExecuted failed for User={UserId}", userId);
            }
        }

        public async Task NotifyAdminDashboardUpdateAsync(object data)
        {
            try
            {
                await _notificationHub.Clients.Group("admins").SendAsync("AdminDashboardUpdated", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR AdminDashboardUpdate failed");
            }
        }

        public async Task NotifyUserPresenceAsync(int userId, string status)
        {
            try
            {
                await _notificationHub.Clients.Group("admins").SendAsync("UserPresenceChanged", new { userId, status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR UserPresence failed for User={UserId}", userId);
            }
        }

        public async Task NotifyDeviceAddedAsync(int userId, object data)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("DeviceAdded", data);
                await _dashboardHub.Clients.Group($"dashboard_{userId}").SendAsync("DashboardUpdated", new { type = "device_added", data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR DeviceAdded failed for User={UserId}", userId);
            }
        }

        public async Task NotifyDeviceRemovedAsync(int userId, int deviceId)
        {
            try
            {
                await _notificationHub.Clients.Group($"user_{userId}").SendAsync("DeviceRemoved", new { deviceId });
                await _dashboardHub.Clients.Group($"dashboard_{userId}").SendAsync("DashboardUpdated", new { type = "device_removed", deviceId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SignalR DeviceRemoved failed for User={UserId}", userId);
            }
        }
    }
}
