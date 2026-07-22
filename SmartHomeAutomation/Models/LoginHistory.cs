using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class LoginHistory
    {
        [Key]
        public int LoginHistoryId { get; set; }

        public int? UserId { get; set; }

        public string Email { get; set; } = string.Empty;

        public bool IsSuccessful { get; set; }

        public string IpAddress { get; set; } = string.Empty;

        public DateTime AttemptedAt { get; set; } = DateTime.Now;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}