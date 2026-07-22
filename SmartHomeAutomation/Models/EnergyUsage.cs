using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class EnergyUsage
    {
        [Key]
        public int EnergyUsageId { get; set; }

        public int DeviceId { get; set; }

        public double PowerConsumption { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.Now;

        [ForeignKey(nameof(DeviceId))]
        public Device? Device { get; set; }
    }
}