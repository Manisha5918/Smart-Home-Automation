namespace SmartHomeAutomation.DTOs
{
    public class CreateAutomationRuleDto
    {
        public int DeviceId { get; set; }

        public string RuleName { get; set; }
            = string.Empty;

        public string TriggerType { get; set; }
            = string.Empty;

        public string TriggerValue { get; set; }
            = string.Empty;

        public string Action { get; set; }
            = string.Empty;
    }
}