using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class VacationDeviceState
    {
        [Key]
        public int VacationDeviceStateId { get; set; }

        public int VacationModeId { get; set; }

        public VacationMode? VacationMode { get; set; }

        public int DeviceId { get; set; }

        public Device? Device { get; set; }

        public string PreviousStatus { get; set; } = string.Empty;
    }
}