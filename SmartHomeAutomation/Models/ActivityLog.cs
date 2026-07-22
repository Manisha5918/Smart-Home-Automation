using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class ActivityLog
    {
        [Key]
        public int ActivityLogId { get; set; }

        public int UserId { get; set; }

        public int? DeviceId { get; set; }

        public string Action { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string? DeviceStatus { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("DeviceId")]
        public Device? Device { get; set; }
    }
}