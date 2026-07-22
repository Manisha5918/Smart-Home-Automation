using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class DeviceAlert
    {
        [Key]
        public int AlertId { get; set; }

        public int DeviceId { get; set; }

        public string AlertType { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsRead { get; set; } = false;

        public Device? Device { get; set; }
    }
}