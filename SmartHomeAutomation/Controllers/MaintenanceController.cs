using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {

        private readonly ApplicationDbContext _context;


        public MaintenanceController(
            ApplicationDbContext context)
        {
            _context = context;
        }



        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirstValue(
                ClaimTypes.NameIdentifier)!);
        }



        [HttpGet("tracker")]
        public async Task<IActionResult> GetMaintenanceTracker()
        {

            var userId =
                GetCurrentUserId();



            var maintenance =
                await _context.MaintenanceSchedules
                .Include(m => m.Device)
                .Where(m =>
                    m.Device.UserId == userId)
                .ToListAsync();



            if (!maintenance.Any())
            {
                return Ok(new
                {
                    message =
                    "No maintenance records found."
                });
            }



            var result =
                maintenance.Select(m =>
                new
                {

                    device =
                    m.Device.Name,


                    serviceType =
                    m.ServiceType,


                    lastService =
                    m.LastServiceDate
                    .ToString("dd MMM yyyy"),



                    nextService =
                    m.NextServiceDate
                    .ToString("dd MMM yyyy"),



                    remainingDays =
                    (m.NextServiceDate -
                    DateTime.Now)
                    .Days,



                    warrantyExpiry =
                    m.WarrantyExpiryDate == null
                    ?
                    "No warranty information"
                    :
                    m.WarrantyExpiryDate
                    .Value
                    .ToString("dd MMM yyyy"),



                    status =
                    m.Status,


                    notes =
                    m.Notes

                });



            return Ok(result);
        }




        [HttpPost]
        public async Task<IActionResult> AddMaintenance(
            MaintenanceSchedule model)
        {

            _context.MaintenanceSchedules
            .Add(model);


            await _context.SaveChangesAsync();



            return Ok(new
            {
                message =
                "Maintenance schedule added."
            });
        }



        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaintenance(
            int id,
            MaintenanceSchedule model)
        {

            var existing =
                await _context.MaintenanceSchedules
                .FindAsync(id);



            if (existing == null)
            {
                return NotFound();
            }



            existing.ServiceType =
                model.ServiceType;


            existing.LastServiceDate =
                model.LastServiceDate;


            existing.NextServiceDate =
                model.NextServiceDate;


            existing.WarrantyExpiryDate =
                model.WarrantyExpiryDate;


            existing.Status =
                model.Status;


            existing.Notes =
                model.Notes;



            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                "Maintenance updated successfully."
            });
        }

    }
}