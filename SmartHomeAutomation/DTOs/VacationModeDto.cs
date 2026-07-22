using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.DTOs
{
    public class VacationModeDto
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public bool EnableSecurityMode { get; set; } = true;
    }
}