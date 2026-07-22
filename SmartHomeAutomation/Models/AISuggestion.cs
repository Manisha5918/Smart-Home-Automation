using System.ComponentModel.DataAnnotations;

namespace SmartHomeAutomation.Models
{
    public class AISuggestion
    {
        [Key]
        public int SuggestionId { get; set; }


        public int UserId { get; set; }


        public int DeviceId { get; set; }


        public string SuggestionType { get; set; }
            = string.Empty;


        public string Message { get; set; }
            = string.Empty;


        public string TriggerType { get; set; }
            = string.Empty;


        public string TriggerValue { get; set; }
            = string.Empty;


        public string Action { get; set; }
            = string.Empty;


        public string Confidence { get; set; }
            = string.Empty;


        public bool IsAccepted { get; set; }
            = false;




        public DateTime CreatedAt { get; set; }
            = DateTime.Now;
    }
}