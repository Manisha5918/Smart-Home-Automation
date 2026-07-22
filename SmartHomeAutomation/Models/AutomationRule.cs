using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class AutomationRule
    {
        [Key]
        public int RuleId { get; set; }

        public int DeviceId { get; set; }

        public string RuleName { get; set; } = string.Empty;

        // Time / Temperature / Motion / Power ...
        public string TriggerType { get; set; } = string.Empty;

        // 12:54 , 28°C , MotionDetected ...
        public string TriggerValue { get; set; } = string.Empty;

        // Turn On / Turn Off
        public string Action { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey(nameof(DeviceId))]
        public Device? Device { get; set; }
    }
}