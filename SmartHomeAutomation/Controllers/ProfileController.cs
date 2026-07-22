using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using System.Security.Claims;

namespace SmartHomeAutomation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfileController(
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
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.CreatedAt,

                    totalDevices = u.Devices.Count(),

                    activeDevices = u.Devices.Count(
                        d => d.Status == "On")
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile(
            UpdateProfileDto profileDto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(
                profileDto.FullName))
            {
                return BadRequest(new
                {
                    message = "Full name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                profileDto.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(
                    u => u.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var email = profileDto.Email
                .Trim()
                .ToLower();

            var emailExists = await _context.Users
                .AnyAsync(u =>
                    u.Email.ToLower() == email &&
                    u.UserId != userId);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "Email already exists."
                });
            }

            user.FullName =
                profileDto.FullName.Trim();

            user.Email = email;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Profile updated successfully.",

                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role
            });
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword(
            ChangePasswordDto passwordDto)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(
                passwordDto.CurrentPassword))
            {
                return BadRequest(new
                {
                    message =
                        "Current password is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                passwordDto.NewPassword))
            {
                return BadRequest(new
                {
                    message =
                        "New password is required."
                });
            }

            if (passwordDto.NewPassword.Length < 6)
            {
                return BadRequest(new
                {
                    message =
                        "New password must contain at least 6 characters."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(
                    u => u.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var validCurrentPassword =
                BCrypt.Net.BCrypt.Verify(
                    passwordDto.CurrentPassword,
                    user.PasswordHash);

            if (!validCurrentPassword)
            {
                return BadRequest(new
                {
                    message =
                        "Current password is incorrect."
                });
            }

            var samePassword =
                BCrypt.Net.BCrypt.Verify(
                    passwordDto.NewPassword,
                    user.PasswordHash);

            if (samePassword)
            {
                return BadRequest(new
                {
                    message =
                        "New password must be different from current password."
                });
            }

            user.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    passwordDto.NewPassword);

            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Password changed successfully."
            });
        }
    }
}