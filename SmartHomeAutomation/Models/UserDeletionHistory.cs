using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class UserDeletionHistory
    {
        [Key]
        public int DeletionHistoryId { get; set; }

        public int DeletedUserId { get; set; }

        public string DeletedUserName { get; set; } = string.Empty;

        public string DeletedUserEmail { get; set; } = string.Empty;

        public int DeletedByAdminId { get; set; }

        public string DeletedByAdminName { get; set; } = string.Empty;

        public string Reason { get; set; } = string.Empty;

        public string? AdditionalNotes { get; set; }

        public DateTime DeletedAt { get; set; } = DateTime.Now;
    }
}