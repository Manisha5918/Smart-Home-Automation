using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;

namespace SmartHomeAutomation.Services
{
    public class AIAutomationSuggestionService
    {

        private readonly ApplicationDbContext _context;


        public AIAutomationSuggestionService(
            ApplicationDbContext context)
        {
            _context = context;
        }



        public async Task GenerateSuggestions(
            int userId)
        {


            var routines =
                await _context.ActivityLogs

                .Where(x =>
                    x.UserId == userId &&
                    x.DeviceId != null &&
                    x.DeviceStatus == "On")

                .GroupBy(x => x.DeviceId)

                .ToListAsync();



            foreach (var routine in routines)
            {

                var latest =
                    routine
                    .OrderBy(x => x.CreatedAt)
                    .Last();


                var suggestion =
                    new Models.AISuggestion
                    {


                        UserId = userId,

                        DeviceId =
                    latest.DeviceId!.Value,


                        SuggestionType =
                    "Routine Automation",


                        Message =
                    $"Create automation for device at {latest.CreatedAt:t}",


                        TriggerType =
                    "Time",


                        TriggerValue =
                    latest.CreatedAt
                    .ToString("HH:mm"),


                        Action = "Turn ON",


                        Confidence =
                    routine.Count() > 5
                    ?
                    "High"
                    :
                    "Low"

                    };


                _context.AISuggestions
                .Add(suggestion);

            }


            await _context.SaveChangesAsync();

        }
    }
}