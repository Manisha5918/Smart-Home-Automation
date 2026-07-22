using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Services;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EnergyAnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EnergyAdvisorService _advisorService;

        public EnergyAnalyticsController(
        ApplicationDbContext context,
        EnergyAdvisorService advisorService)
        {
            _context = context;
            _advisorService = advisorService;
        }


        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!);
        }


        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var userId = GetCurrentUserId();

            var deviceIds = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => d.DeviceId)
                .ToListAsync();

            if (deviceIds.Count == 0)
                return Ok(new { message = "No devices found for this user." });

            var now = DateTime.Now;
            var todayStart = now.Date;
            var weekStart = now.Date.AddDays(-6);
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var previousMonthStart = monthStart.AddMonths(-1);

            // Execute sequentially — DbContext is NOT thread-safe.
            // Each query is a fast server-side aggregate (SUM with WHERE on indexed column).
            // Using AsNoTracking() since these are read-only queries.
            var baseQuery = _context.EnergyUsages
                .AsNoTracking()
                .Where(e => deviceIds.Contains(e.DeviceId));

            var today = await baseQuery
                .Where(e => e.RecordedAt >= todayStart)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            var week = await baseQuery
                .Where(e => e.RecordedAt >= weekStart)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            var month = await baseQuery
                .Where(e => e.RecordedAt >= monthStart)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            var previousMonth = await baseQuery
                .Where(e => e.RecordedAt >= previousMonthStart && e.RecordedAt < monthStart)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            // Highest consuming device this month (server-side grouping, single row returned)
            var highestDevice = await baseQuery
                .Where(e => e.RecordedAt >= monthStart)
                .GroupBy(e => e.DeviceId)
                .Select(g => new { DeviceId = g.Key, Consumption = g.Sum(x => x.PowerConsumption) })
                .OrderByDescending(x => x.Consumption)
                .FirstOrDefaultAsync();

            string highestDeviceName = "No data";
            double highestConsumption = 0;

            if (highestDevice != null)
            {
                var device = await _context.Devices
                    .FirstOrDefaultAsync(d => d.DeviceId == highestDevice.DeviceId);
                if (device != null)
                {
                    highestDeviceName = device.Name;
                    highestConsumption = highestDevice.Consumption;
                }
            }

            string trendMessage;
            if (previousMonth == 0)
                trendMessage = "No previous month data available";
            else
            {
                var trend = ((month - previousMonth) / previousMonth) * 100;
                trendMessage = trend > 0
                    ? $"\u2191 {trend:F2}% compared to last month"
                    : trend < 0
                        ? $"\u2193 {Math.Abs(trend):F2}% compared to last month"
                        : "No change compared to last month";
            }

            return Ok(new
            {
                todayUsage = $"{today:F2}",
                thisWeekUsage = $"{week:F2}",
                thisMonthUsage = $"{month:F2}",
                highestConsumingDevice = highestDeviceName,
                highestConsumption = $"{highestConsumption:F2}",
                energyTrend = trendMessage
            });
        }

        [HttpGet("bill-prediction")]
        public async Task<IActionResult> GetBillPrediction()
        {
            var userId = GetCurrentUserId();

            var deviceIds = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => d.DeviceId)
                .ToListAsync();

            if (deviceIds.Count == 0)
                return Ok(new { message = "No devices found." });

            var now = DateTime.Now;
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var nextMonthStart = monthStart.AddMonths(1);

            // Server-side aggregate: only the SUM value is transferred
            var currentMonthUsage = await _context.EnergyUsages
                .Where(e => deviceIds.Contains(e.DeviceId) && e.RecordedAt >= monthStart && e.RecordedAt < nextMonthStart)
                .SumAsync(e => e.PowerConsumption);



            int daysPassed =
                DateTime.Now.Day;



            double averageDailyUsage =
                currentMonthUsage /
                daysPassed;



            int daysRemaining =
                DateTime.DaysInMonth(
                    DateTime.Now.Year,
                    DateTime.Now.Month)
                -
                daysPassed;



            double predictedMonthUsage =
                currentMonthUsage +
                (averageDailyUsage *
                daysRemaining);



            // Electricity tariff estimation
            // Example: ₹8 per unit

            decimal estimatedBill =
                (decimal)
                predictedMonthUsage *
                8;



            string savingTip;



            if (predictedMonthUsage > 300)
            {
                savingTip =
                "High usage detected. Reduce AC usage to save electricity.";
            }
            else if (predictedMonthUsage > 150)
            {
                savingTip =
                "Moderate usage. Switch off unused devices.";
            }
            else
            {
                savingTip =
                "Great! Your energy usage is efficient.";
            }



            return Ok(new
            {
                currentMonthUsage =
                    $"{currentMonthUsage:F2} units",


                averageDailyUsage =
                    $"{averageDailyUsage:F2} units/day",


                predictedMonthUsage =
                    $"{predictedMonthUsage:F2} units",


                estimatedBill =
                    $"₹{estimatedBill:F2}",


                savingTip
            });
        }

        [HttpGet("recommendations")]
        public async Task<IActionResult> GetEnergyRecommendations()
        {
            var userId = GetCurrentUserId();

            var devices = await _context.Devices
                .Where(d => d.UserId == userId)
                .Select(d => new { d.DeviceId, d.Name, d.Type, d.Status })
                .ToListAsync();

            if (devices.Count == 0)
                return Ok(new { message = "No devices available." });

            var deviceIds = devices.Select(d => d.DeviceId).ToList();

            // Server-side: highest consuming device this month
            var highest = await _context.EnergyUsages
                .Where(e => deviceIds.Contains(e.DeviceId))
                .GroupBy(e => e.DeviceId)
                .Select(g => new { DeviceId = g.Key, Consumption = g.Sum(x => x.PowerConsumption) })
                .OrderByDescending(x => x.Consumption)
                .FirstOrDefaultAsync();

            if (highest == null)
                return Ok(new { message = "No energy data available." });

            var highestDevice = devices.First(d => d.DeviceId == highest.DeviceId);

            double totalConsumption = await _context.EnergyUsages
                .Where(e => deviceIds.Contains(e.DeviceId))
                .SumAsync(e => e.PowerConsumption);



            double percentage =
                (highest.Consumption /
                totalConsumption) * 100;



            string recommendation;


            string priority;



            if (highestDevice.Type
                .Contains("Air",
                StringComparison.OrdinalIgnoreCase))
            {
                recommendation =
                "Reduce AC usage duration or enable automatic temperature control.";

                priority =
                "High";
            }

            else if (highestDevice.Type
                .Contains("Fan",
                StringComparison.OrdinalIgnoreCase))
            {
                recommendation =
                "Reduce fan speed during low occupancy hours or automate OFF when room is empty.";

                priority =
                "Medium";
            }

            else if (highestDevice.Type
                .Contains("Light",
                StringComparison.OrdinalIgnoreCase))
            {
                recommendation =
                "Switch off unnecessary lights or enable motion based automation.";

                priority =
                "Low";
            }

            else
            {
                recommendation =
                "Optimize usage schedule for this device.";

                priority =
                "Medium";
            }



            // Devices left ON

            var devicesOn =
                devices
                .Where(d =>
                    d.Status == "On")
                .Count();



            decimal estimatedSaving =
                (decimal)
                (highest.Consumption * 0.20 * 8);



            return Ok(new
            {

                highestConsumer =
                    highestDevice.Name,


                deviceType =
                    highestDevice.Type,


                energyConsumed =
                    $"{highest.Consumption:F2}",


                energyShare =
                    $"{percentage:F2}%",


                devicesCurrentlyOn =
                    devicesOn,


                recommendation,


                estimatedMonthlySaving =
                    $"₹{estimatedSaving:F2}",


                priority

            });
        }
        [HttpGet("carbon-footprint")]
        public async Task<IActionResult> GetCarbonFootprint()
        {
            var userId = GetCurrentUserId();

            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;

            var energy = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == currentMonth &&
                    e.RecordedAt.Year == currentYear)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            double co2 = energy * 0.82;

            int trees = (int)Math.Round(co2 / 21.0);

            string rating;

            if (co2 < 100)
                rating = "A+";
            else if (co2 < 200)
                rating = "A";
            else if (co2 < 300)
                rating = "B+";
            else if (co2 < 400)
                rating = "B";
            else
                rating = "C";

            return Ok(new
            {
                totalEnergy = $"{energy:F2} kWh",
                co2Produced = $"{co2:F2} kg",
                equivalentTrees = trees,
                carbonRating = rating
            });
        }

        [HttpGet("cost-comparison")]
        public async Task<IActionResult> GetCostComparison()
        {
            var userId = GetCurrentUserId();

            var now = DateTime.Now;

            var currentMonth = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == now.Month &&
                    e.RecordedAt.Year == now.Year)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            var previous = now.AddMonths(-1);

            var previousMonth = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == previous.Month &&
                    e.RecordedAt.Year == previous.Year)
                .SumAsync(e => (double?)e.PowerConsumption) ?? 0;

            double currentBill = currentMonth * 8;
            double previousBill = previousMonth * 8;

            double percentage = 0;

            if (previousBill > 0)
            {
                percentage =
                    ((currentBill - previousBill) /
                    previousBill) * 100;
            }

            var highest = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == now.Month &&
                    e.RecordedAt.Year == now.Year)
                .GroupBy(e => e.Device!.Name)
                .Select(g => new
                {
                    Device = g.Key,
                    Usage = g.Sum(x => x.PowerConsumption)
                })
                .OrderByDescending(x => x.Usage)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                currentMonthBill = $"₹{currentBill:F2}",
                previousMonthBill = $"₹{previousBill:F2}",
                difference = $"{percentage:F2} %",
                highestConsumer = highest?.Device ?? "No Data",
                reason = $"{highest?.Device ?? "No Device"} usage increased."
            });
        }
        [HttpGet("energy-advisor")]
        public async Task<IActionResult> EnergyAdvisor()
        {
            var userId = GetCurrentUserId();


            var devices =
                await _context.Devices
                .Where(d => d.UserId == userId)
                .ToListAsync();


            var suggestions =
                _advisorService
                .GenerateRecommendations(devices);


            return Ok(new
            {
                message =
                "AI Energy Advisor",

                recommendations =
                suggestions
            });
        }

        [HttpGet("top-devices")]
        public async Task<IActionResult> GetTopDevices()
        {
            var userId = GetCurrentUserId();

            var month = DateTime.Now.Month;
            var year = DateTime.Now.Year;


            var devices =
                await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == month &&
                    e.RecordedAt.Year == year)
                .GroupBy(e => new
                {
                    e.DeviceId,
                    e.Device!.Name
                })
                .Select(g => new
                {
                    DeviceId = g.Key.DeviceId,
                    DeviceName = g.Key.Name,
                    EnergyUsed = g.Sum(x => x.PowerConsumption)
                })
                .OrderByDescending(x => x.EnergyUsed)
                .Take(10)
                .ToListAsync();


            var result =
                devices.Select((d, index) => new
                {
                    Rank = index + 1,

                    DeviceName = d.DeviceName,

                    EnergyUsed =
                    $"{d.EnergyUsed} kWh"
                });


            return Ok(new
            {
                title =
                "Top Energy Consumers",

                rankings = result
            });
        }

        [HttpGet("daily-trend")]
        public async Task<IActionResult> GetDailyTrend()
        {
            var userId = GetCurrentUserId();


            var startDate =
                DateTime.Now.Date.AddDays(-6);



            var data =
                await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt >= startDate)
                .GroupBy(e =>
                    e.RecordedAt.Date)
                .Select(g => new
                {
                    day =
                        g.Key.ToString("ddd"),

                    usage =
                        g.Sum(x =>
                            x.PowerConsumption)
                })
                .OrderBy(x => x.day)
                .ToListAsync();



            return Ok(data);
        }

        [HttpGet("device-usage")]
        public async Task<IActionResult> GetDeviceUsage()
        {
            var userId = GetCurrentUserId();

            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;

            var result =
                await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == currentMonth &&
                    e.RecordedAt.Year == currentYear)
                .GroupBy(e => new
                {
                    e.DeviceId,
                    e.Device!.Name
                })
                .Select(g => new
                {
                    device = g.Key.Name,

                    usage =
                        g.Sum(x =>
                            x.PowerConsumption)
                })
                .OrderByDescending(x => x.usage)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("monthly-trend")]
        public async Task<IActionResult> GetMonthlyTrend()
        {
            var userId = GetCurrentUserId();

            var currentYear = DateTime.Now.Year;

            var result = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Year == currentYear)
                .GroupBy(e => e.RecordedAt.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Usage = g.Sum(x => x.PowerConsumption)
                })
                .ToListAsync();

            var months = new[]
            {
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
    };

            var chartData = Enumerable.Range(1, 12)
                .Select(m => new
                {
                    month = months[m - 1],
                    usage = result
                        .FirstOrDefault(x => x.Month == m)?.Usage ?? 0
                });

            return Ok(chartData);
        }

        [HttpGet("usage-share")]
        public async Task<IActionResult> GetUsageShare()
        {
            var userId = GetCurrentUserId();

            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;

            var usages = await _context.EnergyUsages
                .Where(e =>
                    e.Device != null &&
                    e.Device.UserId == userId &&
                    e.RecordedAt.Month == currentMonth &&
                    e.RecordedAt.Year == currentYear)
                .GroupBy(e => new
                {
                    e.DeviceId,
                    e.Device!.Name
                })
                .Select(g => new
                {
                    Device = g.Key.Name,
                    Usage = g.Sum(x => x.PowerConsumption)
                })
                .ToListAsync();

            if (!usages.Any())
            {
                return Ok(new
                {
                    message = "No energy usage data available."
                });
            }

            var total = usages.Sum(x => x.Usage);

            var result = usages
                .OrderByDescending(x => x.Usage)
                .Select(x => new
                {
                    device = x.Device,
                    usage = x.Usage,
                    percentage = Math.Round((x.Usage / total) * 100, 2)
                });

            return Ok(result);
        }
    }
}