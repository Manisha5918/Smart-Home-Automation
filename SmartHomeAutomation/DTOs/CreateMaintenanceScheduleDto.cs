namespace SmartHomeAutomation.DTOs
{
    public class CreateMaintenanceScheduleDto
    {
        public int DeviceId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime ScheduledDate { get; set; }
    }
}