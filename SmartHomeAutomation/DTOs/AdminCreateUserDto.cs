namespace SmartHomeAutomation.DTOs
{
    public class AdminCreateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string Role { get; set; } = "User";
    }
}
