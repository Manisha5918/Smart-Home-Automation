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
    public class FavoriteDeviceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FavoriteDeviceController(ApplicationDbContext context)
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
        public async Task<IActionResult> GetFavoriteDevices()
        {
            var userId = GetCurrentUserId();

            var favorites = await _context.FavoriteDevices
                .Where(f => f.UserId == userId)
                .Include(f => f.Device)
                .ToListAsync();

            return Ok(favorites);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFavoriteDevice(int id)
        {
            var userId = GetCurrentUserId();

            var favorite = await _context.FavoriteDevices
                .Include(f => f.Device)
                .FirstOrDefaultAsync(f =>
                    f.FavoriteId == id &&
                    f.UserId == userId
                );

            if (favorite == null)
            {
                return NotFound(new
                {
                    message = "Favorite device not found."
                });
            }

            return Ok(favorite);
        }

        [HttpPost]
        public async Task<IActionResult> AddFavoriteDevice(
            CreateFavoriteDeviceDto favoriteDto)
        {
            var userId = GetCurrentUserId();

            var deviceExists = await _context.Devices
                .AnyAsync(d =>
                    d.DeviceId == favoriteDto.DeviceId &&
                    d.UserId == userId
                );

            if (!deviceExists)
            {
                return BadRequest(new
                {
                    message = "Device not found."
                });
            }

            var favoriteExists = await _context.FavoriteDevices
                .AnyAsync(f =>
                    f.UserId == userId &&
                    f.DeviceId == favoriteDto.DeviceId
                );

            if (favoriteExists)
            {
                return BadRequest(new
                {
                    message = "Device is already added to favorites."
                });
            }

            var favoriteDevice = new FavoriteDevice
            {
                UserId = userId,
                DeviceId = favoriteDto.DeviceId,
                AddedAt = DateTime.Now
            };

            _context.FavoriteDevices.Add(favoriteDevice);

            await _context.SaveChangesAsync();

            return Ok(favoriteDevice);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFavoriteDevice(int id)
        {
            var userId = GetCurrentUserId();

            var favorite = await _context.FavoriteDevices
                .FirstOrDefaultAsync(f =>
                    f.FavoriteId == id &&
                    f.UserId == userId
                );

            if (favorite == null)
            {
                return NotFound(new
                {
                    message = "Favorite device not found."
                });
            }

            _context.FavoriteDevices.Remove(favorite);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Device removed from favorites successfully."
            });
        }
    }
}