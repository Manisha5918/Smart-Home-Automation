using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class VerificationToken
    {
        [Key]
        public int VerificationTokenId { get; set; }

        public int UserId { get; set; }

        [Required]
        [MaxLength(512)]
        public string Token { get; set; } = string.Empty;

        [MaxLength(8)]
        public string? Otp { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime ExpiresAt { get; set; }

        public bool Used { get; set; } = false;

        public DateTime? UsedAt { get; set; }

        public int Attempts { get; set; } = 0;

        public int MaxAttempts { get; set; } = 5;

        public DateTime? ResendAt { get; set; }

        public int ResendCount { get; set; } = 0;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
