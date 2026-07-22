using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class UserActivity
    {
        [Key]
        public int ActivityId { get; set; }


        public int UserId { get; set; }


        public string ActivityType { get; set; }
            = string.Empty;


        public string Description { get; set; }
            = string.Empty;


        public DateTime CreatedAt { get; set; }
            = DateTime.Now;


        public User? User { get; set; }
    }
}