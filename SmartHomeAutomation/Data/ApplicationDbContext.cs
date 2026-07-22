using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<EnergyGoal> EnergyGoals { get; set; }
        public DbSet<User> Users { get; set; }

        public DbSet<Device> Devices { get; set; }

        public DbSet<DeviceAlert> DeviceAlerts { get; set; }

        public DbSet<Notification> Notifications { get; set; }

        public DbSet<AISuggestion> AISuggestions { get; set; }



        public DbSet<MaintenanceSchedule>
            MaintenanceSchedules
        { get; set; }

        public DbSet<DeviceImage>
            DeviceImages
        { get; set; }

        public DbSet<UserDeletionHistory>
    UserDeletionHistories
        { get; set; }



        public DbSet<FavoriteDevice>
            FavoriteDevices
        { get; set; }

        public DbSet<ActivityLog>
            ActivityLogs
        { get; set; }

        public DbSet<UserActivity> UserActivities { get; set; }

        public DbSet<AutomationRule>
            AutomationRules
        { get; set; }

        public DbSet<EnergyUsage>
            EnergyUsages
        { get; set; }

        public DbSet<Room>
            Rooms
        { get; set; }

        public DbSet<LoginHistory>
            LoginHistories
        { get; set; }


        public DbSet<ConversationMemory> ConversationMemories { get; set; }
        public DbSet<VacationMode> VacationModes { get; set; }

        public DbSet<VacationDeviceState> VacationDeviceStates { get; set; }

        public DbSet<UserNotification> UserNotifications { get; set; }

        public DbSet<SystemSetting> SystemSettings { get; set; }

        public DbSet<GeneratedReport> GeneratedReports { get; set; }

        public DbSet<VerificationToken> VerificationTokens { get; set; }

        public DbSet<EmailLog> EmailLogs { get; set; }

        public DbSet<SecurityEvent> SecurityEvents { get; set; }

        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<PendingRegistration> PendingRegistrations { get; set; }

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Device>()
                .HasOne(d => d.Room)
                .WithMany(r => r.Devices)
                .HasForeignKey(d => d.RoomId)

                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<EnergyGoal>()
    .HasOne(g => g.User)
    .WithMany(u => u.EnergyGoals)
    .HasForeignKey(g => g.UserId)
    .OnDelete(DeleteBehavior.Cascade);

            // ==========================
            // Vacation Mode Relationships
            // ==========================

            modelBuilder.Entity<VacationMode>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VacationDeviceState>()
                .HasOne(v => v.Device)
                .WithMany()
                .HasForeignKey(v => v.DeviceId);

            modelBuilder.Entity<VacationDeviceState>()
                .HasOne(v => v.VacationMode)
                .WithMany()
                .HasForeignKey(v => v.VacationModeId);
        }
    }
}