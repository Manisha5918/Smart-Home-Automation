using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class PendingRegistration
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(256)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(512)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(512)]
        public string Token { get; set; } = string.Empty;

        [MaxLength(8)]
        public string? Otp { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime ExpiresAt { get; set; }

        public int ResendCount { get; set; } = 0;

        public DateTime? ResendAt { get; set; }
    }
}
