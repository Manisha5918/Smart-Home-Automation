namespace SmartHomeAutomation.DTOs
{
    public class DeleteUserDto
    {
        public string Reason { get; set; } = string.Empty;

        public string? AdditionalNotes { get; set; }
    }
}