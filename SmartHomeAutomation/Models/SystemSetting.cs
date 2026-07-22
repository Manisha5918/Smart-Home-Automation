using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class SystemSetting
    {
        [Key]
        public int SettingId { get; set; }

        public string Key { get; set; } = string.Empty;

        public string Value { get; set; } = string.Empty;

        public string Category { get; set; } = "General";

        public string? Description { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public string? UpdatedBy { get; set; }
    }
}
