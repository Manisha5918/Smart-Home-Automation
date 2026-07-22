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
    public class RoomController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoomController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.Parse(userId!);
        }

        [HttpGet]
        public async Task<IActionResult> GetRooms()
        {
            var userId = GetCurrentUserId();

            var rooms = await _context.Rooms
                .Where(r => r.UserId == userId)
                .Select(r => new
                {
                    r.RoomId,
                    r.RoomName,
                    r.Description,
                    r.CreatedAt,

                    DeviceCount = r.Devices.Count()
                })
                .ToListAsync();

            return Ok(rooms);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRoom(int id)
        {
            var userId = GetCurrentUserId();

            var room = await _context.Rooms
                .Where(r =>
                    r.RoomId == id &&
                    r.UserId == userId)
                .Select(r => new
                {
                    r.RoomId,
                    r.RoomName,
                    r.Description,
                    r.CreatedAt,

                    DeviceCount = r.Devices.Count()
                })
                .FirstOrDefaultAsync();

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Room not found."
                });
            }

            return Ok(room);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRoom(
            CreateRoomDto roomDto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(
                roomDto.RoomName))
            {
                return BadRequest(new
                {
                    message = "Room name is required."
                });
            }

            var roomName = roomDto.RoomName.Trim();

            var roomExists = await _context.Rooms
                .AnyAsync(r =>
                    r.UserId == userId &&
                    r.RoomName.ToLower() ==
                    roomName.ToLower());

            if (roomExists)
            {
                return BadRequest(new
                {
                    message =
                        "Room already exists."
                });
            }

            var room = new Room
            {
                UserId = userId,

                RoomName = roomName,

                Description =
                    roomDto.Description?.Trim()
                    ?? string.Empty,

                CreatedAt = DateTime.Now
            };

            _context.Rooms.Add(room);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Room created successfully.",

                room.RoomId,
                room.RoomName,
                room.Description,
                room.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(
            int id,
            CreateRoomDto roomDto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(
                roomDto.RoomName))
            {
                return BadRequest(new
                {
                    message = "Room name is required."
                });
            }

            var room = await _context.Rooms
                .FirstOrDefaultAsync(r =>
                    r.RoomId == id &&
                    r.UserId == userId);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Room not found."
                });
            }

            var newRoomName =
                roomDto.RoomName.Trim();

            var roomExists = await _context.Rooms
                .AnyAsync(r =>
                    r.UserId == userId &&
                    r.RoomId != id &&
                    r.RoomName.ToLower() ==
                    newRoomName.ToLower());

            if (roomExists)
            {
                return BadRequest(new
                {
                    message =
                        "Another room with this name already exists."
                });
            }

            room.RoomName = newRoomName;

            room.Description =
                roomDto.Description?.Trim()
                ?? string.Empty;

            var roomDevices = await _context.Devices
                .Where(d =>
                    d.UserId == userId &&
                    d.RoomId == room.RoomId)
                .ToListAsync();

            foreach (var device in roomDevices)
            {
                device.Location = newRoomName;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Room updated successfully.",

                room.RoomId,
                room.RoomName,
                room.Description,

                updatedDevices =
                    roomDevices.Count
            });
        }

        [HttpGet("{id}/devices")]
        public async Task<IActionResult> GetRoomDevices(
            int id)
        {
            var userId = GetCurrentUserId();

            var room = await _context.Rooms
                .FirstOrDefaultAsync(r =>
                    r.RoomId == id &&
                    r.UserId == userId);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Room not found."
                });
            }

            var devices = await _context.Devices
                .Where(d =>
                    d.UserId == userId &&
                    d.RoomId == room.RoomId)
                .Select(d => new
                {
                    d.DeviceId,
                    d.Name,
                    d.Type,
                    d.Status,
                    d.PowerConsumption,
                    d.RoomId,

                    RoomName = room.RoomName
                })
                .ToListAsync();

            return Ok(new
            {
                roomId = room.RoomId,

                roomName = room.RoomName,

                totalDevices = devices.Count,

                devices
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var userId = GetCurrentUserId();

            var room = await _context.Rooms
                .FirstOrDefaultAsync(r =>
                    r.RoomId == id &&
                    r.UserId == userId);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Room not found."
                });
            }

            var roomDevices = await _context.Devices
                .Where(d =>
                    d.UserId == userId &&
                    d.RoomId == room.RoomId)
                .ToListAsync();

            foreach (var device in roomDevices)
            {
                device.RoomId = null;
            }

            _context.Rooms.Remove(room);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Room deleted successfully.",

                detachedDevices =
                    roomDevices.Count
            });
        }
    }
}