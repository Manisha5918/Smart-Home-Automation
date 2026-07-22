using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class EnergyGoal
    {
        [Key]
        public int GoalId { get; set; }

        public int UserId { get; set; }

        public double MonthlyGoal { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public User? User { get; set; }
    }
}