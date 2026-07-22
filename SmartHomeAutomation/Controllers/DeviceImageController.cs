using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Models;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeviceImageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DeviceImageController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetDeviceImages()
        {
            var userId = GetCurrentUserId();

            var images = await _context.DeviceImages
                .Where(i =>
                    i.Device != null &&
                    i.Device.UserId == userId
                )
                .Include(i => i.Device)
                .OrderByDescending(i => i.UploadedAt)
                .ToListAsync();

            return Ok(images);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeviceImage(int id)
        {
            var userId = GetCurrentUserId();

            var image = await _context.DeviceImages
                .Include(i => i.Device)
                .FirstOrDefaultAsync(i =>
                    i.ImageId == id &&
                    i.Device != null &&
                    i.Device.UserId == userId
                );

            if (image == null)
            {
                return NotFound(new
                {
                    message = "Device image not found."
                });
            }

            return Ok(image);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDeviceImage(
            CreateDeviceImageDto imageDto)
        {
            var userId = GetCurrentUserId();

            var device = await _context.Devices
                .FirstOrDefaultAsync(d =>
                    d.DeviceId == imageDto.DeviceId &&
                    d.UserId == userId
                );

            if (device == null)
            {
                return BadRequest(new
                {
                    message = "Device not found."
                });
            }

            var image = new DeviceImage
            {
                DeviceId = imageDto.DeviceId,
                ImageUrl = imageDto.ImageUrl,
                Description = imageDto.Description,
                UploadedAt = DateTime.Now
            };

            _context.DeviceImages.Add(image);

            await _context.SaveChangesAsync();

            return Ok(image);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDeviceImage(
            int id,
            CreateDeviceImageDto imageDto)
        {
            var userId = GetCurrentUserId();

            var image = await _context.DeviceImages
                .Include(i => i.Device)
                .FirstOrDefaultAsync(i =>
                    i.ImageId == id &&
                    i.Device != null &&
                    i.Device.UserId == userId
                );

            if (image == null)
            {
                return NotFound(new
                {
                    message = "Device image not found."
                });
            }

            var deviceExists = await _context.Devices
                .AnyAsync(d =>
                    d.DeviceId == imageDto.DeviceId &&
                    d.UserId == userId
                );

            if (!deviceExists)
            {
                return BadRequest(new
                {
                    message = "Device not found."
                });
            }

            image.DeviceId = imageDto.DeviceId;
            image.ImageUrl = imageDto.ImageUrl;
            image.Description = imageDto.Description;

            await _context.SaveChangesAsync();

            return Ok(image);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeviceImage(int id)
        {
            var userId = GetCurrentUserId();

            var image = await _context.DeviceImages
                .Include(i => i.Device)
                .FirstOrDefaultAsync(i =>
                    i.ImageId == id &&
                    i.Device != null &&
                    i.Device.UserId == userId
                );

            if (image == null)
            {
                return NotFound(new
                {
                    message = "Device image not found."
                });
            }

            _context.DeviceImages.Remove(image);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Device image deleted successfully."
            });
        }
    }
}