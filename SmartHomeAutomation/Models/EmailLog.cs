using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class EmailLog
    {
        [Key]
        public int EmailLogId { get; set; }

        public int? UserId { get; set; }

        [Required]
        [MaxLength(256)]
        public string Recipient { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        public bool Success { get; set; } = false;

        public string? ErrorMessage { get; set; }

        public DateTime SentAt { get; set; } = DateTime.Now;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
