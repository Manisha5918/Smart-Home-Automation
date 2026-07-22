namespace SmartHomeAutomation.DTOs
{
    public class DetectedRoutineDto
    {
        public int DeviceId { get; set; }

        public string DeviceName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string TypicalTime { get; set; } = string.Empty;

        public int Occurrences { get; set; }

        public double AverageTimeVariationMinutes { get; set; }

        public string Confidence { get; set; } = string.Empty;
    }
}