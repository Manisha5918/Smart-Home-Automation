using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class MaintenanceSchedule
    {
        [Key]
        public int MaintenanceId { get; set; }


        public int DeviceId { get; set; }


        public string ServiceType { get; set; } = string.Empty;


        public DateTime LastServiceDate { get; set; }


        public DateTime NextServiceDate { get; set; }


        public DateTime? WarrantyExpiryDate { get; set; }


        public string Status { get; set; } = "Pending";


        public string Notes { get; set; } = string.Empty;



        public Device? Device { get; set; }
    }
}