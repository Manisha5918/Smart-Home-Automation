namespace SmartHomeAutomation.DTOs
{
    public class RoutineSuggestionDto
    {
        public int DeviceId { get; set; }

        public string DeviceName { get; set; }
            = string.Empty;

        public string SuggestedStatus { get; set; }
            = string.Empty;

        public TimeSpan SuggestedTime { get; set; }

        public double Confidence { get; set; }

        public int MatchingOccurrences { get; set; }

        public string Suggestion { get; set; }
            = string.Empty;
    }
}