namespace SmartHomeAutomation.DTOs
{
    public class CreateDeviceDto
    {
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string Status { get; set; } = "Offline";

        public double PowerConsumption { get; set; }

        public int? RoomId { get; set; }
    }
}