namespace SmartHomeAutomation.DTOs
{
    public class CreateDeviceAlertDto
    {
        public int DeviceId { get; set; }

        public string AlertType { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;
    }
}