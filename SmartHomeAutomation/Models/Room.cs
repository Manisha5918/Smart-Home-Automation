using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class Room
    {
        [Key]
        public int RoomId { get; set; }

        public int UserId { get; set; }

        public string RoomName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        public ICollection<Device> Devices { get; set; }
            = new List<Device>();
    }
}