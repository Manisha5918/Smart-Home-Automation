namespace SmartHomeAutomation.DTOs
{
    public class MonthlyReportDto
    {
        public string Month { get; set; } = string.Empty;

        public double EnergyUsed { get; set; }

        public double ElectricityBill { get; set; }

        public double Co2Saved { get; set; }

        public int EfficiencyRating { get; set; }

        public string MostUsedDevice { get; set; } = string.Empty;

        public double MostUsedDeviceConsumption { get; set; }

        public List<string> AiInsights { get; set; } = new();
    }
}