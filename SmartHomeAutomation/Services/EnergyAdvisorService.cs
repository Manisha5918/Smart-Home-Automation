using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class EnergyAdvisorService
    {

        public List<string> GenerateRecommendations(
            List<Device> devices)
        {
            var recommendations =
                new List<string>();


            var highPower =
                devices
                .Where(d => d.PowerConsumption > 40)
                .ToList();


            foreach (var device in highPower)
            {

                if (device.Type == "Air Conditioner")
                {
                    recommendations.Add(
                    "AC usage is high. Keep temperature above 24°C to save energy.");
                }


                else if (device.Type == "Fan")
                {
                    recommendations.Add(
                    "Fan consumes high energy. Reduce speed when room is empty.");
                }


                else if (device.Type == "Light")
                {
                    recommendations.Add(
                    "Lights are consuming extra energy. Turn OFF unused lights.");
                }

            }


            if (recommendations.Count == 0)
            {
                recommendations.Add(
                "Your energy usage is optimized. Keep maintaining this habit.");
            }


            return recommendations;
        }
    }
}