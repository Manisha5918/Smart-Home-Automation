namespace SmartHomeAutomation.DTOs
{
    public class AISuggestionDto
    {
        public int DeviceId { get; set; }

        public string DeviceName { get; set; } = string.Empty;

        public string Suggestion { get; set; } = string.Empty;

        public string TriggerType { get; set; } = string.Empty;

        public string TriggerValue { get; set; } = string.Empty;

        public string Action { get; set; } = string.Empty;

        public string Confidence { get; set; } = string.Empty;
    }
}