using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class UserNotification
    {
        [Key]
        public int UserNotificationId { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}