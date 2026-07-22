using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class AutomationRuleService
    {
        private readonly ApplicationDbContext _context;


        public AutomationRuleService(
            ApplicationDbContext context)
        {
            _context = context;
        }



        public async Task EvaluateRulesAsync(
            Device device)
        {
            var rules = await _context.AutomationRules

                .Where(r =>
                    r.DeviceId == device.DeviceId &&
                    r.IsActive)

                .ToListAsync();



            foreach (var rule in rules)
            {
                bool conditionMatched = false;



                // Power based automation
                if (rule.TriggerType
                    .Equals(
                        "Power",
                        StringComparison.OrdinalIgnoreCase))
                {

                    if (rule.TriggerValue
                        .Equals(
                            "High",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        conditionMatched =
                            device.PowerConsumption > 40;
                    }


                    else if (rule.TriggerValue
                        .Equals(
                            "Low",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        conditionMatched =
                            device.PowerConsumption < 10;
                    }
                }




                // Device status automation
                else if (rule.TriggerType
                    .Equals(
                        "Status",
                        StringComparison.OrdinalIgnoreCase))
                {

                    conditionMatched =
                        device.Status.Equals(
                            rule.TriggerValue,
                            StringComparison.OrdinalIgnoreCase);
                }




                // Time based automation
                else if (rule.TriggerType
                    .Equals(
                        "Time",
                        StringComparison.OrdinalIgnoreCase))
                {

                    var currentTime =
                        DateTime.Now.ToString("HH:mm");


                    conditionMatched =
                        currentTime ==
                        rule.TriggerValue;
                }



                if (!conditionMatched)
                {
                    continue;
                }



                string oldStatus =
                    device.Status;



                // Execute action

                if (rule.Action
                    .Equals(
                        "TurnOn",
                        StringComparison.OrdinalIgnoreCase))
                {
                    device.Status = "On";
                }


                else if (rule.Action
                    .Equals(
                        "TurnOff",
                        StringComparison.OrdinalIgnoreCase))
                {
                    device.Status = "Off";
                }




                var activityLog =
                    new ActivityLog
                    {
                        UserId = device.UserId,

                        DeviceId = device.DeviceId,

                        Action =
                        "Automation Rule Executed",

                        Description =
                        $"Rule '{rule.RuleName}' changed " +
                        $"{device.Name} from {oldStatus} " +
                        $"to {device.Status}",

                        DeviceStatus =
                        device.Status,

                        CreatedAt =
                        DateTime.Now
                    };


                _context.ActivityLogs
                    .Add(activityLog);




                var notification =
                    new Notification
                    {
                        UserId =
                        device.UserId,

                        Title =
                        "Automation Rule Executed",

                        Message =
                        $"Rule '{rule.RuleName}' executed for {device.Name}."
                    };


                _context.Notifications
                    .Add(notification);
            }



            await _context.SaveChangesAsync();
        }
    }
}