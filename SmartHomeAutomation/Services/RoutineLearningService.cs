using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;

namespace SmartHomeAutomation.Services
{
    public class RoutineLearningService
    {
        private readonly ApplicationDbContext _context;

        public RoutineLearningService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DetectedRoutineDto>> DetectRoutinesAsync(
            int userId)
        {
            var startDate = DateTime.Now.AddDays(-30);

            var activityLogs = await _context.ActivityLogs
                .Where(a =>
                    a.UserId == userId &&
                    a.DeviceId != null &&
                    a.DeviceStatus != null &&
                    (a.Action == "Device Status Changed" || a.Action == "Automation Executed") &&
                    a.CreatedAt >= startDate)
                .Include(a => a.Device)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            var routines = new List<DetectedRoutineDto>();

            var deviceGroups = activityLogs
                .Where(a => a.Device != null)
                .GroupBy(a => new
                {
                    a.DeviceId,
                    DeviceName = a.Device!.Name,
                    a.DeviceStatus
                });

            foreach (var group in deviceGroups)
            {
                var logs = group.ToList();

                Console.WriteLine(
                    $"Device: {group.Key.DeviceName}");

                Console.WriteLine(
                    $"Status: {group.Key.DeviceStatus}");

                Console.WriteLine(
                    $"Occurrences: {logs.Count}");

                if (logs.Count < 2)
                {
                    Console.WriteLine(
                        "Skipped because occurrences < 3");

                    continue;
                }

                var minutesOfDay = logs
                    .Select(log =>
                        (log.CreatedAt.Hour * 60) +
                        log.CreatedAt.Minute)
                    .ToList();

                var averageMinutes =
                    CalculateCircularAverage(minutesOfDay);

                var averageDifference = minutesOfDay
                    .Average(minutes =>
                        CalculateCircularDifference(
                            minutes,
                            averageMinutes));

                Console.WriteLine(
                    $"Average Difference: {averageDifference}");

                if (averageDifference > 60)
                {
                    Console.WriteLine(
                        "Skipped because variation > 60");

                    continue;
                }

                var averageHour =
                    averageMinutes / 60;

                var averageMinute =
                    averageMinutes % 60;

                var typicalTime = new TimeSpan(
                    averageHour,
                    averageMinute,
                    0);


                Console.WriteLine("Routine Added");
                routines.Add(new DetectedRoutineDto
                {
                    DeviceId = group.Key.DeviceId ?? 0,

                    DeviceName = group.Key.DeviceName,

                    Status = group.Key.DeviceStatus!,

                    TypicalTime =
                    DateTime.Today
                        .Add(typicalTime)
                        .ToString("hh:mm tt"),

                    Occurrences = logs.Count,

                    AverageTimeVariationMinutes =
                    Math.Round(averageDifference, 2),

                    Confidence =
                    CalculateConfidence(
                        logs.Count,
                        averageDifference)
                });
            }

            return routines;
        }

        private static int CalculateCircularAverage(
            List<int> minutesOfDay)
        {
            var angles = minutesOfDay
                .Select(minutes =>
                    minutes *
                    2 *
                    Math.PI /
                    1440)
                .ToList();

            var averageSin =
                angles.Average(Math.Sin);

            var averageCos =
                angles.Average(Math.Cos);

            var averageAngle =
                Math.Atan2(
                    averageSin,
                    averageCos);

            if (averageAngle < 0)
            {
                averageAngle +=
                    2 * Math.PI;
            }

            var averageMinutes =
                (int)Math.Round(
                    averageAngle *
                    1440 /
                    (2 * Math.PI));

            return averageMinutes % 1440;
        }

        private static double CalculateCircularDifference(
            int firstMinutes,
            int secondMinutes)
        {
            var difference =
                Math.Abs(
                    firstMinutes -
                    secondMinutes);

            return Math.Min(
                difference,
                1440 - difference);
        }

        private static string CalculateConfidence(
            int occurrences,
            double averageDifference)
        {
            if (occurrences >= 7 &&
                averageDifference <= 20)
            {
                return "High";
            }

            if (occurrences >= 5 &&
                averageDifference <= 40)
            {
                return "Medium";
            }

            return "Low";
        }
    }
}