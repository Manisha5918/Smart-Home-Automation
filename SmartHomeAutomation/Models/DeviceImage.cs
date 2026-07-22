using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHomeAutomation.Models
{
    public class DeviceImage
    {
        [Key]
        public int ImageId { get; set; }

        public int DeviceId { get; set; }

        public string ImageUrl { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        [ForeignKey("DeviceId")]
        public Device? Device { get; set; }
    }
}