using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        public string FullName { get; set; }
            = string.Empty;

        public string Email { get; set; }
            = string.Empty;

        public string PasswordHash { get; set; }
            = string.Empty;

        public string Role { get; set; }
            = "User";

        public bool IsEmailVerified { get; set; }
            = true;

        public DateTime? EmailVerifiedAt { get; set; }

        public string? PendingEmail { get; set; }

        public DateTime CreatedAt { get; set; }
            = DateTime.Now;

        public int FailedLoginAttempts { get; set; }
            = 0;

        public DateTime? LockoutEnd { get; set; }

        public string? LockoutReason { get; set; }

        public DateTime? LastLoginAt { get; set; }

        public DateTime? CurrentSessionStartedAt
        {
            get;
            set;
        }

        public int TotalUsageMinutes { get; set; }
            = 0;

        public bool IsDeleted { get; set; }
            = false;

        public DateTime? DeletedAt { get; set; }

        public string? DeleteReason { get; set; }

        public ICollection<Device>? Devices
        {
            get;
            set;
        }
        public ICollection<EnergyGoal>? EnergyGoals { get; set; }
    }
}