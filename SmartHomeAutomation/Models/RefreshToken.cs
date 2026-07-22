using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class RefreshToken
    {
        [Key]
        public int RefreshTokenId { get; set; }

        public int UserId { get; set; }

        [Required]
        [MaxLength(512)]
        public string Token { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? RevokedAt { get; set; }

        public bool IsRevoked => RevokedAt.HasValue;

        public bool IsExpired => DateTime.Now >= ExpiresAt;

        public bool IsActive => !IsRevoked && !IsExpired;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
