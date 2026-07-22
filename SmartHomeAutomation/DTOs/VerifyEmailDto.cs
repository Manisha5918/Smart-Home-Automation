namespace SmartHomeAutomation.DTOs
{
    public class VerifyEmailDto
    {
        public string Token { get; set; } = string.Empty;
        public string? Otp { get; set; }
    }
}
