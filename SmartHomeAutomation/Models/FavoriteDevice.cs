using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class FavoriteDevice
    {
        [Key]
        public int FavoriteId { get; set; }

        public int UserId { get; set; }

        public int DeviceId { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.Now;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("DeviceId")]
        public Device? Device { get; set; }
    }
}