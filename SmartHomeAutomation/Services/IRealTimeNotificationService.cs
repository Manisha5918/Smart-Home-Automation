namespace SmartHomeAutomation.Services
{
    public interface IRealTimeNotificationService
    {
        Task NotifyUserAsync(int userId, string method, object data);
        Task NotifyAllAsync(string method, object data);
        Task NotifyAdminsAsync(string method, object data);
        Task NotifyDashboardUpdateAsync(int userId, object data);
        Task NotifyDeviceStatusChangedAsync(int userId, object data);
        Task NotifyNewNotificationAsync(int userId, object data);
        Task NotifyNewActivityAsync(int userId, object data);
        Task NotifyEnergyUpdateAsync(int userId, object data);
        Task NotifySecurityAlertAsync(int userId, object data);
        Task NotifyAIChatCompletedAsync(int userId, object data);
        Task NotifyAutomationExecutedAsync(int userId, object data);
        Task NotifyAdminDashboardUpdateAsync(object data);
        Task NotifyUserPresenceAsync(int userId, string status);
        Task NotifyDeviceAddedAsync(int userId, object data);
        Task NotifyDeviceRemovedAsync(int userId, int deviceId);
    }
}
