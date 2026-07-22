using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class VacationMode
    {
        [Key]
        public int VacationModeId { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }

        public bool IsEnabled { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool SecurityModeEnabled { get; set; } = true;

        public double EstimatedEnergySaved { get; set; }

        public decimal EstimatedMoneySaved { get; set; }

        public double EstimatedCO2Saved { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}