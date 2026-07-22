namespace SmartHomeAutomation.Models
{
    public class Device
    {
        public int DeviceId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string Status { get; set; } = "Offline";

        public double PowerConsumption { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }

        public int? RoomId { get; set; }

        public int HealthScore { get; set; } = 100;

        public int TotalAnomalies { get; set; } = 0;

        public DateTime? LastHealthUpdated { get; set; }

        public Room? Room { get; set; }

        public ICollection<EnergyUsage> EnergyUsages { get; set; }
            = new List<EnergyUsage>();
    }
}