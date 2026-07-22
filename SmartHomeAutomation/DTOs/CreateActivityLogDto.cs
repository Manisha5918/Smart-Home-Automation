namespace SmartHomeAutomation.DTOs
{
    public class CreateActivityLogDto
    {
        public int? DeviceId { get; set; }

        public string Action { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}