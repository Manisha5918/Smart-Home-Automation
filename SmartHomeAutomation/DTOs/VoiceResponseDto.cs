namespace SmartHomeAutomation.DTOs
{
    public class VoiceResponseDto
    {
        public bool Success { get; set; }
        public string Action { get; set; } = string.Empty;
        public string SpokenResponse { get; set; } = string.Empty;
        public object? Data { get; set; }
    }
}
