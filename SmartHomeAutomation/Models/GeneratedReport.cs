using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class GeneratedReport
    {
        [Key]
        public int ReportId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Format { get; set; } = "json";

        public string Period { get; set; } = "month";

        public string Status { get; set; } = "Completed";

        public string GeneratedBy { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string? Details { get; set; }
    }
}
