using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class ConversationMemory
    {
        [Key]
        public int MemoryId { get; set; }

        public int UserId { get; set; }

        public string Role { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}