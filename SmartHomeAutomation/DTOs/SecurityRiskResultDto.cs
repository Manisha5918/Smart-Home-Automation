namespace SmartHomeAutomation.DTOs
{
    public class SecurityRiskResultDto
    {
        public int RiskScore { get; set; }

        public string RiskLevel { get; set; }
            = string.Empty;

        public int FailedLoginAttempts { get; set; }

        public int UniqueIpAddresses { get; set; }

        public int UnusualHourAttempts { get; set; }

        public bool RapidAttemptsDetected { get; set; }

        public List<string> RiskFactors { get; set; }
            = new();
    }
}