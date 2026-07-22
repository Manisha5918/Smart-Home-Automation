namespace SmartHomeAutomation.DTOs
{
    public class CreateDeviceImageDto
    {
        public int DeviceId { get; set; }

        public string ImageUrl { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}