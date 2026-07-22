using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Models;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailTemplateService _emailTemplateService;
        private readonly IEmailService _emailService;
        private readonly SecurityEventService _securityEventService;
        private readonly IConfiguration _configuration;
        private readonly IRealTimeNotificationService _realtimeService;

        public AdminController(
            ApplicationDbContext context,
            EmailTemplateService emailTemplateService,
            IEmailService emailService,
            SecurityEventService securityEventService,
            IConfiguration configuration,
            IRealTimeNotificationService realtimeService)
        {
            _context = context;
            _emailTemplateService = emailTemplateService;
            _emailService = emailService;
            _securityEventService = securityEventService;
            _configuration = configuration;
            _realtimeService = realtimeService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        // =====================================================
        // ADMIN DASHBOARD
        // =====================================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var totalUsers =
                await _context.Users
                .CountAsync(x => !x.IsDeleted);

            var totalAdmins =
                await _context.Users
                .CountAsync(x =>
                    x.Role == "Admin" &&
                    !x.IsDeleted);

            var totalRegularUsers =
                await _context.Users
                .CountAsync(x =>
                    x.Role == "User" &&
                    !x.IsDeleted);

            var totalDevices =
                await _context.Devices.CountAsync();

            var activeDevices =
                await _context.Devices
                .CountAsync(x => x.Status == "On");

            var automationRules =
                await _context.AutomationRules
                .CountAsync();

            var totalAlerts =
                await _context.DeviceAlerts
                .CountAsync();

            var totalNotifications =
                await _context.Notifications
                .CountAsync();

            var lockedUsers =
                await _context.Users
                .CountAsync(x =>
                    x.LockoutEnd != null &&
                    x.LockoutEnd > DateTime.Now);

            var onlineUsers =
                await _context.Users
                .CountAsync(x =>
                    x.CurrentSessionStartedAt != null);

            var totalUsageMinutes =
                await _context.Users
                .Where(x => !x.IsDeleted)
                .SumAsync(x => x.TotalUsageMinutes);

            return Ok(new
            {
                totalUsers,
                totalAdmins,
                totalRegularUsers,
                totalDevices,
                activeDevices,
                automationRules,
                totalAlerts,
                totalNotifications,
                lockedUsers,
                onlineUsers,
                totalUsageMinutes
            });
        }

        // =====================================================
        // ALL USERS
        // =====================================================

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users =
                await _context.Users

                .Include(x => x.Devices)

                .Where(x => !x.IsDeleted)

                .OrderByDescending(x => x.CreatedAt)

                .Select(u => new
                {
                    u.UserId,

                    u.FullName,

                    u.Email,

                    u.Role,

                    AccountCreated = u.CreatedAt,

                    LastLogin = u.LastLoginAt,

                    UsageMinutes =
                        u.TotalUsageMinutes,

                    Online =
                        u.CurrentSessionStartedAt != null,

                    DeviceCount =
                        u.Devices.Count(),

                    FailedAttempts =
                        u.FailedLoginAttempts,

                    Locked =
                        u.LockoutEnd != null &&
                        u.LockoutEnd > DateTime.Now
                })

                .ToListAsync();

            return Ok(users);
        }

        // =====================================================
        // SINGLE USER DETAILS
        // =====================================================

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user =
                await _context.Users

                .Include(x => x.Devices)

                .Where(x =>
                    x.UserId == id &&
                    !x.IsDeleted)

                .Select(u => new
                {
                    u.UserId,

                    u.FullName,

                    u.Email,

                    u.Role,

                    u.CreatedAt,

                    u.LastLoginAt,

                    u.TotalUsageMinutes,

                    Online =
                        u.CurrentSessionStartedAt != null,

                    Devices =
                        u.Devices.Select(d => new
                        {
                            d.DeviceId,

                            d.Name,

                            d.Type,

                            d.Status,

                            d.PowerConsumption
                        })
                })

                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }

        // =====================================================
        // SYSTEM ANALYTICS
        // =====================================================

        [HttpGet("analytics")]
        public async Task<IActionResult> Analytics()
        {
            var users = await _context.Users
                .Where(x => !x.IsDeleted)
                .ToListAsync();

            var devices = await _context.Devices.ToListAsync();

            var alerts = await _context.DeviceAlerts.ToListAsync();

            var notifications = await _context.Notifications.ToListAsync();

            return Ok(new
            {
                TotalUsers = users.Count,

                TotalAdmins = users.Count(x => x.Role == "Admin"),

                TotalRegularUsers = users.Count(x => x.Role == "User"),

                OnlineUsers =
                    users.Count(x => x.CurrentSessionStartedAt != null),

                OfflineUsers =
                    users.Count(x => x.CurrentSessionStartedAt == null),

                TotalDevices = devices.Count,

                ActiveDevices =
                    devices.Count(x => x.Status == "On"),

                OfflineDevices =
                    devices.Count(x => x.Status != "On"),

                TotalAlerts = alerts.Count,

                TotalNotifications = notifications.Count,

                TotalUsageHours =
                    Math.Round(users.Sum(x => x.TotalUsageMinutes) / 60.0, 2),

                AverageUsageHours =
                    users.Count == 0
                        ? 0
                        : Math.Round(users.Average(x => x.TotalUsageMinutes) / 60.0, 2)
            });
        }


        // =====================================================
        // RECENT USERS
        // =====================================================

        [HttpGet("recent-users")]
        public async Task<IActionResult> RecentUsers()
        {
            var users = await _context.Users

                .Where(x => !x.IsDeleted)

                .OrderByDescending(x => x.CreatedAt)

                .Take(10)

                .Select(x => new
                {
                    x.UserId,
                    x.FullName,
                    x.Email,
                    x.CreatedAt
                })

                .ToListAsync();

            return Ok(users);
        }

        // =====================================================
        // MOST ACTIVE USERS
        // =====================================================

        [HttpGet("top-users")]
        public async Task<IActionResult> TopUsers()
        {
            var users = await _context.Users

                .Where(x => !x.IsDeleted)

                .OrderByDescending(x => x.TotalUsageMinutes)

                .Take(10)

                .Select(x => new
                {
                    x.UserId,
                    x.FullName,
                    x.Email,
                    x.TotalUsageMinutes,
                    Hours =
                        Math.Round(x.TotalUsageMinutes / 60.0, 2)
                })

                .ToListAsync();

            return Ok(users);
        }

        // =====================================================
        // DEVICE DISTRIBUTION
        // =====================================================

        [HttpGet("device-types")]
        public async Task<IActionResult> DeviceTypes()
        {
            var data = await _context.Devices
                .GroupBy(x => x.Type)
                .Select(g => new
                {
                    type = g.Key,
                    count = g.Count()
                })
                .ToListAsync();

            return Ok(data);
        }

        // =====================================================
        // USER GROWTH
        // =====================================================

        [HttpGet("user-growth")]
        public async Task<IActionResult> UserGrowth()
        {
            var data = await _context.Users
                .Where(x => !x.IsDeleted)
                .GroupBy(x => x.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key,
                    users = g.Count()
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            return Ok(data);
        }
        // =====================================================
        // UPDATE USER ROLE
        // =====================================================

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(
            int id,
            UpdateUserRoleDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (dto.Role != "Admin" &&
                dto.Role != "User")
            {
                return BadRequest(new
                {
                    message = "Role must be Admin or User."
                });
            }

            if (user.UserId == GetCurrentUserId() &&
                dto.Role == "User")
            {
                return BadRequest(new
                {
                    message =
                    "You cannot remove your own admin role."
                });
            }

            var oldRole = user.Role;

            user.Role = dto.Role;

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyAdminDashboardUpdateAsync(new
            {
                type = "role_updated",
                userId = user.UserId,
                oldRole,
                newRole = user.Role,
                timestamp = DateTime.Now
            });

            return Ok(new
            {
                message = "Role updated successfully.",

                userId = user.UserId,

                user.FullName,

                oldRole,

                newRole = user.Role
            });
        }

        // =====================================================
        // UNLOCK USER
        // =====================================================

        [HttpPut("users/{id}/unlock")]
        public async Task<IActionResult> UnlockUser(int id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.LockoutEnd = null;

            user.FailedLoginAttempts = 0;

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyAdminDashboardUpdateAsync(new
            {
                type = "user_unlocked",
                userId = id,
                timestamp = DateTime.Now
            });

            return Ok(new
            {
                message = "User unlocked successfully."
            });
        }

        // =====================================================
        // FAILED LOGIN HISTORY
        // =====================================================

        [HttpGet("failed-logins")]
        public async Task<IActionResult> GetFailedLogins()
        {
            var history =
                await _context.LoginHistories

                .Where(x => !x.IsSuccessful)

                .OrderByDescending(x => x.AttemptedAt)

                .Take(100)

                .Select(x => new
                {
                    x.LoginHistoryId,

                    x.UserId,

                    x.Email,

                    x.IpAddress,

                    x.AttemptedAt
                })

                .ToListAsync();

            return Ok(history);
        }

        // =====================================================
        // DANGEROUS USERS
        // =====================================================

        [HttpGet("danger-users")]
        public async Task<IActionResult> GetDangerUsers()
        {
            var users =
                await _context.Users

                .Include(x => x.Devices)

                .Where(x =>
                    !x.IsDeleted &&
                    (
                        x.FailedLoginAttempts >= 3 ||

                        (
                            x.LockoutEnd != null &&
                            x.LockoutEnd > DateTime.Now
                        )
                    )
                )

                .Select(x => new
                {
                    x.UserId,

                    x.FullName,

                    x.Email,

                    x.Role,

                    x.FailedLoginAttempts,

                    x.LockoutEnd,

                    x.LastLoginAt,

                    x.TotalUsageMinutes,

                    DeviceCount =
                        x.Devices.Count(),

                    RiskLevel =
                        x.LockoutEnd != null &&
                        x.LockoutEnd > DateTime.Now
                        ? "Danger"
                        : "Warning"
                })

                .ToListAsync();

            return Ok(users);
        }

        // =====================================================
        // USER ACTIVITY ANALYTICS
        // =====================================================

        [HttpGet("user-activity")]
        public async Task<IActionResult> UserActivity()
        {
            var users =
                await _context.Users

                .Include(x => x.Devices)

                .Where(x => !x.IsDeleted)

                .OrderByDescending(x => x.TotalUsageMinutes)

                .Select(x => new
                {
                    x.UserId,

                    x.FullName,

                    x.Email,

                    x.CreatedAt,

                    x.LastLoginAt,

                    x.TotalUsageMinutes,

                    UsageHours =
                        Math.Round(
                            x.TotalUsageMinutes / 60.0,
                            2),

                    DeviceCount =
                        x.Devices.Count(),

                    Online =
                        x.CurrentSessionStartedAt != null
                })

                .ToListAsync();

            return Ok(users);
        }

        // =====================================================
        // LOGIN HISTORY OF ONE USER
        // =====================================================

        [HttpGet("users/{id}/login-history")]
        public async Task<IActionResult> UserLoginHistory(int id)
        {
            var history =
                await _context.LoginHistories

                .Where(x => x.UserId == id)

                .OrderByDescending(x => x.AttemptedAt)

                .ToListAsync();

            return Ok(history);
        }

        // =====================================================
        // USER DEVICES
        // =====================================================

        [HttpGet("users/{id}/devices")]
        public async Task<IActionResult> UserDevices(int id)
        {
            var user =
                await _context.Users

                .Include(x => x.Devices)

                .FirstOrDefaultAsync(
                    x => x.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(new
            {
                user.UserId,

                user.FullName,

                user.Email,

                TotalDevices =
                    user.Devices.Count,

                ActiveDevices =
                    user.Devices.Count(
                        x => x.Status == "On"),

                Devices =
                    user.Devices.Select(d => new
                    {
                        d.DeviceId,

                        d.Name,

                        d.Type,

                        d.Status,

                        d.PowerConsumption
                    })
            });
        }

        // =====================================================
        // DELETE USER (SOFT DELETE)
        // =====================================================

        // =====================================================
        // ALL DEVICES (ACROSS ALL USERS)
        // =====================================================

        [HttpGet("all-devices")]
        public async Task<IActionResult> GetAllDevices()
        {
            var devices = await _context.Devices
                .Include(d => d.User)
                .Include(d => d.Room)
                .OrderByDescending(d => d.DeviceId)
                .Select(d => new
                {
                    d.DeviceId,
                    d.Name,
                    d.Type,
                    d.Status,
                    d.Location,
                    d.PowerConsumption,
                    d.HealthScore,
                    d.TotalAnomalies,
                    OwnerName = d.User != null ? d.User.FullName : "Unknown",
                    OwnerEmail = d.User != null ? d.User.Email : "Unknown",
                    OwnerId = d.UserId,
                    RoomName = d.Room != null ? d.Room.RoomName : "Unassigned",
                    d.LastHealthUpdated
                })
                .ToListAsync();

            return Ok(devices);
        }

        // =====================================================
        // ALL ACTIVITY LOGS (ACROSS ALL USERS)
        // =====================================================

        [HttpGet("all-activity-logs")]
        public async Task<IActionResult> GetAllActivityLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _context.ActivityLogs
                .Include(a => a.User)
                .Include(a => a.Device)
                .OrderByDescending(a => a.CreatedAt);

            var total = await query.CountAsync();

            var logs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.ActivityLogId,
                    a.UserId,
                    UserName = a.User != null ? a.User.FullName : "Unknown",
                    UserEmail = a.User != null ? a.User.Email : "Unknown",
                    a.DeviceId,
                    DeviceName = a.Device != null ? a.Device.Name : "N/A",
                    a.Action,
                    a.Description,
                    a.CreatedAt,
                    a.DeviceStatus
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, logs });
        }

        // =====================================================
        // ENERGY OVERVIEW (ADMIN)
        // =====================================================

        [HttpGet("energy/overview")]
        public async Task<IActionResult> GetEnergyOverview()
        {
            var today = DateTime.Today;
            var yesterday = today.AddDays(-1);
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            var todayUsage = await _context.EnergyUsages
                .Where(e => e.RecordedAt >= today)
                .SumAsync(e => e.PowerConsumption);

            var yesterdayUsage = await _context.EnergyUsages
                .Where(e => e.RecordedAt >= yesterday && e.RecordedAt < today)
                .SumAsync(e => e.PowerConsumption);

            var weeklyUsage = await _context.EnergyUsages
                .Where(e => e.RecordedAt >= startOfWeek)
                .SumAsync(e => e.PowerConsumption);

            var monthlyUsage = await _context.EnergyUsages
                .Where(e => e.RecordedAt >= startOfMonth)
                .SumAsync(e => e.PowerConsumption);

            var totalUsage = await _context.EnergyUsages
                .SumAsync(e => e.PowerConsumption);

            var averageUsage = totalUsage > 0
                ? Math.Round(totalUsage / 30.0, 2)
                : 0;

            var deviceBreakdown = await _context.EnergyUsages
                .Include(e => e.Device)
                .GroupBy(e => e.Device!.Type)
                .Select(g => new
                {
                    deviceType = g.Key,
                    consumption = Math.Round(g.Sum(e => e.PowerConsumption), 2),
                    percentage = totalUsage > 0
                        ? Math.Round(g.Sum(e => e.PowerConsumption) / totalUsage * 100, 1)
                        : 0
                })
                .ToListAsync();

            var dailyTrend = await _context.EnergyUsages
                .Where(e => e.RecordedAt >= startOfMonth)
                .GroupBy(e => e.RecordedAt.Date)
                .Select(g => new
                {
                    date = g.Key,
                    consumption = Math.Round(g.Sum(e => e.PowerConsumption), 2)
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            return Ok(new
            {
                todayUsage = Math.Round(todayUsage, 2),
                yesterdayUsage = Math.Round(yesterdayUsage, 2),
                weeklyUsage = Math.Round(weeklyUsage, 2),
                monthlyUsage = Math.Round(monthlyUsage, 2),
                totalUsage = Math.Round(totalUsage, 2),
                averageDailyUsage = averageUsage,
                deviceBreakdown,
                dailyTrend,
                periodStart = startOfMonth,
                periodEnd = today
            });
        }

        // =====================================================
        // ENERGY REPORT BY PERIOD
        // =====================================================

        [HttpGet("energy/report")]
        public async Task<IActionResult> GetEnergyReport(
            [FromQuery] string period = "month")
        {
            DateTime startDate;
            var today = DateTime.Today;

            switch (period.ToLower())
            {
                case "week":
                    startDate = today.AddDays(-7);
                    break;
                case "month":
                    startDate = today.AddMonths(-1);
                    break;
                case "quarter":
                    startDate = today.AddMonths(-3);
                    break;
                case "year":
                    startDate = today.AddYears(-1);
                    break;
                default:
                    startDate = today.AddMonths(-1);
                    break;
            }

            var usageData = await _context.EnergyUsages
                .Include(e => e.Device)
                .Where(e => e.RecordedAt >= startDate)
                .ToListAsync();

            var totalConsumption = Math.Round(usageData.Sum(e => e.PowerConsumption), 2);
            var recordCount = usageData.Count;

            var byDevice = usageData
                .GroupBy(e => e.Device!.Name)
                .Select(g => new
                {
                    DeviceName = g.Key,
                    Consumption = Math.Round(g.Sum(e => e.PowerConsumption), 2),
                    Percentage = totalConsumption > 0
                        ? Math.Round(g.Sum(e => e.PowerConsumption) / totalConsumption * 100, 1)
                        : 0
                })
                .OrderByDescending(x => x.Consumption)
                .ToList();

            var byType = usageData
                .GroupBy(e => e.Device!.Type)
                .Select(g => new
                {
                    DeviceType = g.Key,
                    Consumption = Math.Round(g.Sum(e => e.PowerConsumption), 2)
                })
                .OrderByDescending(x => x.Consumption)
                .ToList();

            return Ok(new
            {
                period,
                startDate,
                endDate = today,
                totalConsumption,
                recordCount,
                byDevice,
                byType
            });
        }

        // =====================================================
        // SYSTEM SETTINGS
        // =====================================================

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.SystemSettings
                .OrderBy(s => s.Category)
                .ThenBy(s => s.Key)
                .ToListAsync();

            return Ok(settings);
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings(
            [FromBody] List<SystemSetting> updatedSettings)
        {
            var currentAdmin = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == GetCurrentUserId());

            foreach (var updated in updatedSettings)
            {
                var existing = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.SettingId == updated.SettingId);

                if (existing != null)
                {
                    existing.Value = updated.Value;
                    existing.UpdatedAt = DateTime.Now;
                    existing.UpdatedBy = currentAdmin?.FullName ?? "Admin";
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Settings updated successfully." });
        }

        // =====================================================
        // SYSTEM HEALTH
        // =====================================================

        [HttpGet("system-health")]
        public async Task<IActionResult> GetSystemHealth()
        {
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users
                .CountAsync(u => u.CurrentSessionStartedAt != null);
            var totalDevices = await _context.Devices.CountAsync();
            var activeDevices = await _context.Devices
                .CountAsync(d => d.Status == "On");
            var totalAlerts = await _context.DeviceAlerts.CountAsync();
            var unreadAlerts = await _context.DeviceAlerts
                .CountAsync(a => !a.IsRead);
            var totalNotifications = await _context.Notifications.CountAsync();
            var unreadNotifications = await _context.Notifications
                .CountAsync(n => !n.IsRead);
            var activeAutomationRules = await _context.AutomationRules
                .CountAsync(r => r.IsActive);
            var pendingMaintenance = await _context.MaintenanceSchedules
                .CountAsync(m => m.Status == "Pending");
            var totalEnergyRecords = await _context.EnergyUsages.CountAsync();
            var lockedAccounts = await _context.Users
                .CountAsync(u => u.LockoutEnd != null && u.LockoutEnd > DateTime.Now);
            var deletedUsers = await _context.Users
                .CountAsync(u => u.IsDeleted);

            return Ok(new
            {
                status = "Healthy",
                timestamp = DateTime.Now,
                metrics = new
                {
                    totalUsers,
                    activeUsers,
                    offlineUsers = totalUsers - activeUsers,
                    totalDevices,
                    activeDevices,
                    inactiveDevices = totalDevices - activeDevices,
                    totalAlerts,
                    unreadAlerts,
                    totalNotifications,
                    unreadNotifications,
                    activeAutomationRules,
                    pendingMaintenance,
                    totalEnergyRecords,
                    lockedAccounts,
                    deletedUsers
                }
            });
        }

        // =====================================================
        // DEVICE METRICS
        // =====================================================

        [HttpGet("analytics/device-metrics")]
        public async Task<IActionResult> GetDeviceMetrics()
        {
            var devices = await _context.Devices.ToListAsync();

            var byStatus = devices
                .GroupBy(d => d.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToList();

            var byType = devices
                .GroupBy(d => d.Type)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            var totalPower = Math.Round(devices.Sum(d => d.PowerConsumption), 2);

            var avgHealthScore = devices.Count > 0
                ? Math.Round(devices.Average(d => d.HealthScore), 1)
                : 0;

            var faultyDevices = devices.Count(d => d.HealthScore < 60 || d.TotalAnomalies > 5);

            var byLocation = devices
                .GroupBy(d => d.Location)
                .Select(g => new { Location = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            return Ok(new
            {
                totalDevices = devices.Count,
                byStatus,
                byType,
                totalPowerConsumption = totalPower,
                averageHealthScore = avgHealthScore,
                faultyDevices,
                byLocation
            });
        }

        // =====================================================
        // ACTIVITY SUMMARY
        // =====================================================

        [HttpGet("analytics/activity-summary")]
        public async Task<IActionResult> GetActivitySummary()
        {
            var today = DateTime.Today;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            var totalActivities = await _context.ActivityLogs.CountAsync();
            var todayActivities = await _context.ActivityLogs
                .CountAsync(a => a.CreatedAt >= today);
            var monthlyActivities = await _context.ActivityLogs
                .CountAsync(a => a.CreatedAt >= startOfMonth);

            var byAction = await _context.ActivityLogs
                .GroupBy(a => a.Action)
                .Select(g => new { action = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .ToListAsync();

            var hourlyDistribution = await _context.ActivityLogs
                .Where(a => a.CreatedAt >= today.AddDays(-7))
                .GroupBy(a => a.CreatedAt.Hour)
                .Select(g => new { hour = g.Key, count = g.Count() })
                .OrderBy(x => x.hour)
                .ToListAsync();

            return Ok(new
            {
                totalActivities,
                todayActivities,
                monthlyActivities,
                byAction,
                hourlyDistribution
            });
        }

        // =====================================================
        // ANALYTICS - ENERGY SUMMARY
        // =====================================================

        [HttpGet("analytics/energy-summary")]
        public async Task<IActionResult> GetEnergySummary()
        {
            var today = DateTime.Today;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            var totalEnergy = await _context.EnergyUsages
                .SumAsync(e => e.PowerConsumption);

            var monthlyEnergy = await _context.EnergyUsages
                .Where(e => e.RecordedAt >= startOfMonth)
                .SumAsync(e => e.PowerConsumption);

            var todayEnergy = await _context.EnergyUsages
                .Where(e => e.RecordedAt >= today)
                .SumAsync(e => e.PowerConsumption);

            var recordCount = await _context.EnergyUsages.CountAsync();

            var topConsumingDevices = await _context.EnergyUsages
                .Include(e => e.Device)
                .GroupBy(e => new { e.DeviceId, DeviceName = e.Device!.Name })
                .Select(g => new
                {
                    deviceId = g.Key.DeviceId,
                    deviceName = g.Key.DeviceName,
                    consumption = Math.Round(g.Sum(e => e.PowerConsumption), 2)
                })
                .OrderByDescending(x => x.consumption)
                .Take(10)
                .ToListAsync();

            return Ok(new
            {
                totalEnergy = Math.Round(totalEnergy, 2),
                monthlyEnergy = Math.Round(monthlyEnergy, 2),
                todayEnergy = Math.Round(todayEnergy, 2),
                averageDaily = recordCount > 0
                    ? Math.Round(totalEnergy / recordCount, 2)
                    : 0,
                recordCount,
                topConsumingDevices
            });
        }

        // =====================================================
        // REPORTS - GENERATE
        // =====================================================

        [HttpPost("reports/generate")]
        public async Task<IActionResult> GenerateReport(
            [FromBody] ReportRequestDto dto)
        {
            var admin = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == GetCurrentUserId());

            object reportData;

            switch (dto.Type?.ToLower())
            {
                case "energy":
                    reportData = await GetEnergyReportData(dto.Period ?? "month");
                    break;
                case "device":
                    reportData = await GetDeviceReportData();
                    break;
                case "activity":
                    reportData = await GetActivityReportData(dto.Period ?? "month");
                    break;
                case "user":
                    reportData = await GetUserReportData();
                    break;
                default:
                    return BadRequest(new { message = "Invalid report type. Use: energy, device, activity, user" });
            }

            var report = new GeneratedReport
            {
                Type = dto.Type ?? "unknown",
                Format = dto.Format ?? "json",
                Period = dto.Period ?? "month",
                Status = "Completed",
                GeneratedBy = admin?.FullName ?? "Admin",
                CreatedAt = DateTime.Now,
                Details = $"{dto.Type} report ({dto.Period})"
            };

            _context.GeneratedReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Report generated successfully",
                type = dto.Type,
                format = dto.Format ?? "json",
                period = dto.Period ?? "month",
                generatedAt = DateTime.Now,
                generatedBy = admin?.FullName ?? "Admin",
                data = reportData
            });
        }

        private async Task<object> GetEnergyReportData(string period)
        {
            DateTime startDate;
            var today = DateTime.Today;

            switch (period.ToLower())
            {
                case "today": startDate = today; break;
                case "week": startDate = today.AddDays(-7); break;
                case "month": startDate = today.AddMonths(-1); break;
                case "quarter": startDate = today.AddMonths(-3); break;
                case "year": startDate = today.AddYears(-1); break;
                default: startDate = today.AddMonths(-1); break;
            }

            var usageData = await _context.EnergyUsages
                .Include(e => e.Device)
                .Where(e => e.RecordedAt >= startDate)
                .ToListAsync();

            return new
            {
                totalConsumption = Math.Round(usageData.Sum(e => e.PowerConsumption), 2),
                recordCount = usageData.Count,
                period,
                startDate,
                endDate = today,
                byDeviceType = usageData
                    .GroupBy(e => e.Device!.Type)
                    .Select(g => new { type = g.Key, consumption = Math.Round(g.Sum(e => e.PowerConsumption), 2) })
                    .OrderByDescending(x => x.consumption)
                    .ToList()
            };
        }

        private async Task<object> GetDeviceReportData()
        {
            var devices = await _context.Devices
                .Include(d => d.User)
                .ToListAsync();

            return new
            {
                totalDevices = devices.Count,
                activeDevices = devices.Count(d => d.Status == "On"),
                offlineDevices = devices.Count(d => d.Status != "On"),
                averageHealthScore = devices.Count > 0 ? Math.Round(devices.Average(d => d.HealthScore), 1) : 0,
                faultyDevices = devices.Count(d => d.HealthScore < 60 || d.TotalAnomalies > 5),
                totalPowerConsumption = Math.Round(devices.Sum(d => d.PowerConsumption), 2),
                byType = devices.GroupBy(d => d.Type).Select(g => new { type = g.Key, count = g.Count() }).ToList(),
                byStatus = devices.GroupBy(d => d.Status).Select(g => new { status = g.Key, count = g.Count() }).ToList()
            };
        }

        private async Task<object> GetActivityReportData(string period)
        {
            DateTime startDate;
            var today = DateTime.Today;

            switch (period.ToLower())
            {
                case "today": startDate = today; break;
                case "week": startDate = today.AddDays(-7); break;
                case "month": startDate = today.AddMonths(-1); break;
                case "quarter": startDate = today.AddMonths(-3); break;
                case "year": startDate = today.AddYears(-1); break;
                default: startDate = today.AddMonths(-1); break;
            }

            var logs = await _context.ActivityLogs
                .Include(a => a.User)
                .Where(a => a.CreatedAt >= startDate)
                .ToListAsync();

            return new
            {
                totalActivities = logs.Count,
                period,
                startDate,
                endDate = today,
                byAction = logs.GroupBy(l => l.Action).Select(g => new { action = g.Key, count = g.Count() }).OrderByDescending(x => x.count).ToList()
            };
        }

        private async Task<object> GetUserReportData()
        {
            var users = await _context.Users
                .Where(u => !u.IsDeleted)
                .ToListAsync();

            return new
            {
                totalUsers = users.Count,
                adminCount = users.Count(u => u.Role == "Admin"),
                userCount = users.Count(u => u.Role == "User"),
                onlineUsers = users.Count(u => u.CurrentSessionStartedAt != null),
                lockedUsers = users.Count(u => u.LockoutEnd != null && u.LockoutEnd > DateTime.Now),
                averageUsageMinutes = users.Count > 0 ? Math.Round(users.Average(u => u.TotalUsageMinutes), 1) : 0
            };
        }

        // =====================================================
        // REPORTS - LIST RECENT
        // =====================================================

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            var reports = await _context.GeneratedReports
                .OrderByDescending(r => r.CreatedAt)
                .Take(50)
                .Select(r => new
                {
                    id = r.ReportId,
                    type = r.Type,
                    format = r.Format,
                    period = r.Period,
                    status = r.Status,
                    createdAt = r.CreatedAt,
                    generatedBy = r.GeneratedBy,
                    details = r.Details
                })
                .ToListAsync();

            return Ok(reports);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserDto dto)
        {
            var currentAdminId = GetCurrentUserId();

            if (await _context.Users.AnyAsync(x => x.Email == dto.Email && !x.IsDeleted))
            {
                return Conflict(new { message = "A user with this email already exists." });
            }

            var tempPassword = GenerateTemporaryPassword();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = passwordHash,
                Role = dto.Role ?? "User",
                IsDeleted = false,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var admin = await _context.Users.FirstOrDefaultAsync(x => x.UserId == currentAdminId);

            var verificationToken = new VerificationToken
            {
                UserId = user.UserId,
                Token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)),
                Otp = new Random().Next(100000, 999999).ToString(),
                Type = "EmailVerification",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
            _context.VerificationTokens.Add(verificationToken);
            await _context.SaveChangesAsync();

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";
            var baseUrl = _configuration.GetSection("App")?["BaseUrl"] ?? "http://localhost:5173";

            var verificationLink = $"{baseUrl}/verify-email?token={verificationToken.Token}&email={dto.Email}";
            var welcomeBody = _emailTemplateService.BuildWelcomeEmail(
                dto.FullName, verificationLink, tempPassword);
            await _emailService.SendEmailAsync(user.UserId, user.Email,
                "Welcome to Smart Home Automation – Your Account Details", welcomeBody, "WelcomeEmail");

            await _securityEventService.LogEventAsync(user.UserId, "AccountCreatedByAdmin",
                $"Account created by admin {admin?.FullName ?? "Unknown"}", ipAddress, userAgent);
            await _securityEventService.LogActivityAsync(currentAdminId, "User Created",
                $"Admin created user {user.FullName} ({user.Email})");

            return Ok(new
            {
                message = "User created successfully.",
                user = new
                {
                    id = user.UserId,
                    fullName = user.FullName,
                    email = user.Email,
                    role = user.Role
                }
            });
        }

        private static string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
            var data = new byte[12];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(data);
            }
            return new string(data.Select(b => chars[b % chars.Length]).ToArray());
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(
            int id,
            [FromBody] DeleteUserDto dto)
        {
            var currentAdminId = GetCurrentUserId();

            if (id == currentAdminId)
            {
                return BadRequest(new
                {
                    message = "You cannot delete your own admin account."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (user.IsDeleted)
            {
                return BadRequest(new
                {
                    message = "User already deleted."
                });
            }

            var admin = await _context.Users
                .FirstOrDefaultAsync(x => x.UserId == currentAdminId);

            // Notification

            _context.Notifications.Add(new Notification
            {
                UserId = user.UserId,
                Title = "Account Deleted",
                Message =
                    $"Your account has been deleted by administrator.\nReason : {dto.Reason}",

                IsRead = false,
                CreatedAt = DateTime.Now
            });

            // Deletion History

            _context.UserDeletionHistories.Add(
                new UserDeletionHistory
                {
                    DeletedUserId = user.UserId,

                    DeletedUserName = user.FullName,

                    DeletedUserEmail = user.Email,

                    DeletedByAdminId = admin!.UserId,

                    DeletedByAdminName = admin.FullName,

                    Reason = dto.Reason,

                    AdditionalNotes =
                        dto.AdditionalNotes,

                    DeletedAt = DateTime.Now
                });

            user.IsDeleted = true;

            user.DeletedAt = DateTime.Now;

            user.DeleteReason = dto.Reason;

            user.CurrentSessionStartedAt = null;

            await _context.SaveChangesAsync();

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";

            var deleteEmailBody = _emailTemplateService.BuildAccountDeletedEmail(
                user.FullName, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), dto.Reason);
            await _emailService.SendEmailAsync(user.UserId, user.Email,
                "Your Smart Home Automation Account Has Been Removed", deleteEmailBody, "AccountDeleted");

            await _securityEventService.LogEventAsync(user.UserId, "AccountDeleted",
                $"Account deleted by admin. Reason: {dto.Reason ?? "Not specified"}", ipAddress, userAgent);
            await _securityEventService.LogActivityAsync(currentAdminId, "User Deleted",
                $"Admin deleted user {user.FullName} ({user.Email})");

            return Ok(new
            {
                message = "User deleted successfully."
            });
        }

        // =====================================================
        // DELETED USERS
        // =====================================================

        [HttpGet("deleted-users")]
        public async Task<IActionResult> DeletedUsers()
        {
            var users =
                await _context.Users

                .Where(x => x.IsDeleted)

                .OrderByDescending(x => x.DeletedAt)

                .Select(x => new
                {
                    x.UserId,

                    x.FullName,

                    x.Email,

                    x.CreatedAt,

                    x.LastLoginAt,

                    x.TotalUsageMinutes,

                    x.DeletedAt,

                    x.DeleteReason
                })

                .ToListAsync();

            return Ok(users);
        }


        // =====================================================
        // DELETION HISTORY
        // =====================================================

        [HttpGet("deletion-history")]
        public async Task<IActionResult> DeletionHistory()
        {
            var history =
                await _context.UserDeletionHistories
                .OrderByDescending(x => x.DeletedAt)
                .ToListAsync();

            return Ok(history);
        }


        // ADD NEW METHOD HERE

        [HttpGet("users-details")]
        public async Task<IActionResult> GetAllUserDetails()
        {
            var users = await _context.Users
                .Where(u => !u.IsDeleted)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.CreatedAt,
                    u.LastLoginAt,
                    u.TotalUsageMinutes,

                    IsOnline =
                        u.CurrentSessionStartedAt != null,

                    DeviceCount =
                        u.Devices.Count()
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(users);
        }


        // =====================================================
        // DTO
        // =====================================================

        public class UpdateUserRoleDto
        {
            public string Role { get; set; } = string.Empty;
        }

        public class ReportRequestDto
        {
            public string Type { get; set; } = string.Empty;
            public string Format { get; set; } = "json";
            public string Period { get; set; } = "month";
        }
        [HttpGet("vacation-users")]
        public async Task<IActionResult> GetVacationUsers()
        {
            var users =
                await _context.VacationModes
                .Where(v => v.IsEnabled)
                .Select(v => new
                {
                    v.UserId,

                    userName =
                    v.User.FullName,

                    email =
                    v.User.Email,

                    startDate =
                    v.StartDate,

                    endDate =
                    v.EndDate,

                    securityEnabled =
                    v.SecurityModeEnabled,

                    energySaved =
                    v.EstimatedEnergySaved
                })
                .ToListAsync();


            return Ok(users);
        }




        [HttpGet("vacation-security-events")]
        public async Task<IActionResult> GetVacationSecurityEvents()
        {
            var events =
                await _context.DeviceAlerts
                .Where(a =>
                    a.AlertType ==
                    "Security Alert")
                .OrderByDescending(a =>
                    a.CreatedAt)
                .Select(a => new
                {
                    alertId =
                    a.AlertId,

                    device =
                    a.Device.Name,

                    eventMessage =
                    a.Message,

                    time =
                    a.CreatedAt,

                    isRead =
                    a.IsRead,

                    owner =
                    a.Device.User.FullName
                })
                .Take(100)
                .ToListAsync();


            return Ok(events);
        }
    }
}






