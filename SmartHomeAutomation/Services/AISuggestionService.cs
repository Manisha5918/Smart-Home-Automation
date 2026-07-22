using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class AISuggestionService
    {
        private readonly RoutineLearningService _routineLearningService;

        private readonly ApplicationDbContext _context;

        public AISuggestionService(
            RoutineLearningService routineLearningService,
            ApplicationDbContext context)
        {
            _routineLearningService = routineLearningService;

            _context = context;
        }

        public async Task<List<AISuggestion>> GetSuggestionsAsync(int? userId)
        {
            var query = _context.AISuggestions
                .Where(x => !x.IsAccepted)
                .AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(x => x.UserId == userId.Value);
            }

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task GenerateSuggestionsAsync(
            int? userId)
        {
            List<int> targetUserIds;

            if (userId.HasValue)
            {
                targetUserIds = new List<int> { userId.Value };
            }
            else
            {
                targetUserIds = await _context.Users
                    .Where(u => u.IsDeleted != true)
                    .Select(u => u.UserId)
                    .ToListAsync();
            }

            foreach (var uid in targetUserIds)
            {
                var routines =
                    await _routineLearningService
                    .DetectRoutinesAsync(uid);

                foreach (var routine in routines)
                {
                    var existing = await _context.AISuggestions
                        .FirstOrDefaultAsync(s =>
                            s.UserId == uid &&
                            s.DeviceId == routine.DeviceId &&
                            s.Action == (routine.Status == "On" ? "TurnOn" : "TurnOff") &&
                            !s.IsAccepted);

                    if (existing != null) continue;

                    var suggestion =
                        new AISuggestion
                        {
                            UserId = uid,
                            DeviceId = routine.DeviceId,
                            Message = $"Create automation to turn {routine.Status} {routine.DeviceName} every day at {routine.TypicalTime}.",
                            TriggerType = "Time",
                            TriggerValue = routine.TypicalTime,
                            Action = routine.Status == "On" ? "TurnOn" : "TurnOff",
                            Confidence = routine.Confidence,
                            IsAccepted = false,
                            CreatedAt = DateTime.Now
                        };

                    _context.AISuggestions.Add(suggestion);
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}