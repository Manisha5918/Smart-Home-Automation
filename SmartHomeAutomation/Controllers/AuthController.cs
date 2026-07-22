using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.DTOs;
using SmartHomeAutomation.Helpers;
using SmartHomeAutomation.Models;
using SmartHomeAutomation.Services;
using System.Security.Claims;
using System.Security.Cryptography;

namespace SmartHomeAutomation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;
        private readonly EmailTemplateService _emailTemplateService;
        private readonly IEmailService _emailService;
        private readonly SecurityEventService _securityEventService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IRealTimeNotificationService _realtimeService;

        public AuthController(
            ApplicationDbContext context,
            JwtService jwtService,
            EmailTemplateService emailTemplateService,
            IEmailService emailService,
            SecurityEventService securityEventService,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            IRealTimeNotificationService realtimeService)
        {
            _context = context;
            _jwtService = jwtService;
            _emailTemplateService = emailTemplateService;
            _emailService = emailService;
            _securityEventService = securityEventService;
            _configuration = configuration;
            _logger = logger;
            _realtimeService = realtimeService;
        }

        private string GenerateSecureToken(int length = 64)
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(length))
                .Replace("/", "_").Replace("+", "-").Replace("=", "");
        }

        private string GenerateOtp()
        {
            return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        }

        private string GetIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        private string GetUserAgent()
        {
            return Request.Headers["User-Agent"].ToString() ?? "Unknown";
        }

        private (string browser, string device) ParseUserAgent(string userAgent)
        {
            var browser = "Unknown";
            var device = "Unknown";

            if (string.IsNullOrEmpty(userAgent)) return (browser, device);

            if (userAgent.Contains("Chrome") && !userAgent.Contains("Edg")) browser = "Chrome";
            else if (userAgent.Contains("Firefox")) browser = "Firefox";
            else if (userAgent.Contains("Safari") && !userAgent.Contains("Chrome")) browser = "Safari";
            else if (userAgent.Contains("Edg")) browser = "Edge";
            else if (userAgent.Contains("MSIE") || userAgent.Contains("Trident")) browser = "Internet Explorer";

            if (userAgent.Contains("Windows")) device = "Windows";
            else if (userAgent.Contains("Mac OS")) device = "macOS";
            else if (userAgent.Contains("Linux") && !userAgent.Contains("Android")) device = "Linux";
            else if (userAgent.Contains("Android")) device = "Android";
            else if (userAgent.Contains("iPhone") || userAgent.Contains("iPad")) device = "iOS";

            return (browser, device);
        }

        // POST /api/Auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "All fields are required." });
            }

            if (dto.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters." });
            }

            if (await _context.Users.AnyAsync(u => u.Email == email && !u.IsDeleted))
            {
                return BadRequest(new { message = "An account with this email already exists." });
            }

            var oldPending = await _context.PendingRegistrations
                .Where(p => p.Email == email)
                .ToListAsync();
            _context.PendingRegistrations.RemoveRange(oldPending);
            await _context.SaveChangesAsync();

            var token = GenerateSecureToken();
            var otp = GenerateOtp();
            var pending = new PendingRegistration
            {
                FullName = dto.FullName,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Token = token,
                Otp = otp,
                CreatedAt = DateTime.Now,
                ExpiresAt = DateTime.Now.AddMinutes(30)
            };

            _context.PendingRegistrations.Add(pending);
            await _context.SaveChangesAsync();

            var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5173";
            var verifyLink = $"{baseUrl}/verify-email?token={token}&email={Uri.EscapeDataString(email)}";
            var verifyBody = _emailTemplateService.BuildVerifyEmail(dto.FullName, verifyLink, otp);
            await _emailService.SendEmailAsync(null, email, "Verify Your Email - Smart Home Automation", verifyBody, "EmailVerification");

            var welcomeBody = _emailTemplateService.BuildWelcomeEmail(dto.FullName, verifyLink, null);
            await _emailService.SendEmailAsync(null, email, "Welcome to Smart Home Automation", welcomeBody, "Welcome");

            _logger.LogInformation("Pending registration created for {Email}", email);

            return Ok(new { message = "Registration successful. Please check your email to verify your account.", email });
        }

        // POST /api/Auth/verify-email
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var pending = await _context.PendingRegistrations
                    .FirstOrDefaultAsync(p => p.Token == dto.Token);

                if (pending == null)
                {
                    await transaction.CommitAsync();
                    _logger.LogInformation("Verify-email: token {Token} not found", dto.Token);
                    return Ok(new { message = "This email has already been verified or the verification link has expired." });
                }

                _logger.LogInformation(
                    "Verify-email: pending Id={Id}, Token={Token}, Email={Email}",
                    pending.Id, pending.Token, pending.Email);

                if (pending.ExpiresAt < DateTime.Now)
                {
                    _context.PendingRegistrations.Remove(pending);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return BadRequest(new { message = "Verification link has expired. Please register again." });
                }

                if (await _context.Users.AnyAsync(u => u.Email == pending.Email && !u.IsDeleted))
                {
                    _context.PendingRegistrations.Remove(pending);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return BadRequest(new { message = "An account with this email already exists." });
                }

                var user = new User
                {
                    FullName = pending.FullName,
                    Email = pending.Email,
                    PasswordHash = pending.PasswordHash,
                    Role = "User",
                    IsEmailVerified = true,
                    EmailVerifiedAt = DateTime.Now,
                    FailedLoginAttempts = 0,
                    CreatedAt = DateTime.Now
                };

                _context.Users.Add(user);
                _context.PendingRegistrations.Remove(pending);

                // EF Core's SaveChangesAsync naturally acts as the concurrency guard:
                // If another request already deleted this PendingRegistration row,
                // the DELETE affects 0 rows and EF Core throws DbUpdateConcurrencyException
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Account created for {Email} after verification (pending id: {PendingId})",
                    user.Email, pending.Id);

                await _securityEventService.LogEventAsync(user.UserId, "Registration",
                    "Account created and email verified", GetIpAddress(), GetUserAgent());
                await _securityEventService.LogActivityAsync(user.UserId, "Account Verified",
                    "User verified email and account was activated");

                return Ok(new { message = "Email verified successfully. You can now log in.", fullName = user.FullName, email = user.Email });
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning("Verify-email: concurrency — token {Token} already consumed", dto.Token);
                return Ok(new { message = "This email has already been verified." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Verify-email: unexpected error for token {Token}", dto.Token);
                return StatusCode(500, new { message = "Verification failed due to a server error. Please try again.", detail = ex.Message });
            }
        }

        // POST /api/Auth/resend-verification
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(ResendVerificationDto dto)
        {
            var pending = await _context.PendingRegistrations
                .Where(p => p.Email == dto.Email.Trim().ToLower())
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (pending == null)
                return Ok(new { message = "If the account exists, a verification email has been sent." });

            if (pending.ExpiresAt < DateTime.Now)
            {
                _context.PendingRegistrations.Remove(pending);
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Verification link has expired. Please register again." });
            }

            if (pending.ResendCount >= 3)
                return BadRequest(new { message = "Too many resend attempts. Please try again later." });

            if (pending.ResendAt.HasValue && pending.ResendAt > DateTime.Now)
            {
                var waitSeconds = (int)(pending.ResendAt.Value - DateTime.Now).TotalSeconds;
                return BadRequest(new { message = $"Please wait {waitSeconds} seconds before requesting another email." });
            }

            var newToken = GenerateSecureToken();
            var newOtp = GenerateOtp();
            pending.Token = newToken;
            pending.Otp = newOtp;
            pending.CreatedAt = DateTime.Now;
            pending.ExpiresAt = DateTime.Now.AddMinutes(30);
            pending.ResendCount++;
            pending.ResendAt = DateTime.Now.AddSeconds(30);

            await _context.SaveChangesAsync();

            var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5173";
            var verifyLink = $"{baseUrl}/verify-email?token={newToken}&email={Uri.EscapeDataString(pending.Email)}";
            var verifyBody = _emailTemplateService.BuildVerifyEmail(pending.FullName, verifyLink, newOtp);
            await _emailService.SendEmailAsync(null, pending.Email, "Verify Your Email - Smart Home Automation", verifyBody, "EmailVerification");

            _logger.LogInformation("Verification email resent to {Email}", pending.Email);

            return Ok(new { message = "Verification email sent. Please check your inbox." });
        }

        // POST /api/Auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var ipAddress = GetIpAddress();
            var userAgent = GetUserAgent();
            var (browser, device) = ParseUserAgent(userAgent);

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email && !x.IsDeleted);

            if (user == null)
            {
                var pending = await _context.PendingRegistrations
                    .Where(p => p.Email == email)
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (pending != null)
                {
                    var expired = pending.ExpiresAt < DateTime.Now;
                    return Unauthorized(new
                    {
                        message = expired
                            ? "Your verification link has expired. Please register again."
                            : "Please verify your email before logging in.",
                        needsVerification = true,
                        email,
                        canResend = !expired
                    });
                }

                var failedLogin = new LoginHistory
                {
                    UserId = null,
                    Email = email,
                    IsSuccessful = false,
                    IpAddress = ipAddress,
                    AttemptedAt = DateTime.Now
                };
                _context.LoginHistories.Add(failedLogin);
                await _context.SaveChangesAsync();

                return Unauthorized(new { message = "Invalid email or password." });
            }

            if (user.IsDeleted)
            {
                return Unauthorized(new { message = "This account has been deactivated." });
            }

            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.Now)
            {
                var remainingTime = user.LockoutEnd.Value - DateTime.Now;
                return StatusCode(423, new
                {
                    message = "Account is temporarily locked.",
                    lockoutEnd = user.LockoutEnd,
                    remainingMinutes = Math.Ceiling(remainingTime.TotalMinutes)
                });
            }

            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value <= DateTime.Now)
            {
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                user.LockoutReason = null;
                await _context.SaveChangesAsync();
            }

            bool validPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

            if (!validPassword)
            {
                user.FailedLoginAttempts++;

                _context.LoginHistories.Add(new LoginHistory
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    IsSuccessful = false,
                    IpAddress = ipAddress,
                    AttemptedAt = DateTime.Now
                });

                if (user.FailedLoginAttempts >= 5)
                {
                    var lockoutMinutes = 15;
                    user.LockoutEnd = DateTime.Now.AddMinutes(lockoutMinutes);
                    user.LockoutReason = "Multiple failed login attempts";

                    await _context.SaveChangesAsync();

                    var lockEmailBody = _emailTemplateService.BuildAccountLockedEmail(
                        user.FullName, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                        ipAddress, browser, lockoutMinutes);
                    await _emailService.SendEmailAsync(user.UserId, user.Email,
                        "Account Temporarily Locked - Smart Home Automation", lockEmailBody, "AccountLocked");

                    await _securityEventService.LogEventAsync(user.UserId, "AccountLocked",
                        $"Account locked due to {user.FailedLoginAttempts} failed login attempts", ipAddress, userAgent);

                    return StatusCode(423, new
                    {
                        message = "Account locked due to multiple failed login attempts.",
                        lockoutMinutes = lockoutMinutes,
                        lockoutEnd = user.LockoutEnd
                    });
                }

                await _context.SaveChangesAsync();

                return Unauthorized(new
                {
                    message = "Invalid email or password.",
                    remainingAttempts = 5 - user.FailedLoginAttempts
                });
            }

            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            user.LockoutReason = null;
            user.LastLoginAt = DateTime.Now;
            user.CurrentSessionStartedAt = DateTime.Now;

            _context.LoginHistories.Add(new LoginHistory
            {
                UserId = user.UserId,
                Email = user.Email,
                IsSuccessful = true,
                IpAddress = ipAddress,
                AttemptedAt = DateTime.Now
            });

            var token = _jwtService.GenerateToken(user);

            var refreshToken = new RefreshToken
            {
                UserId = user.UserId,
                Token = GenerateSecureToken(),
                ExpiresAt = DateTime.Now.AddDays(7),
                CreatedAt = DateTime.Now
            };
            _context.RefreshTokens.Add(refreshToken);

            await _context.SaveChangesAsync();

            await _securityEventService.LogEventAsync(user.UserId, "Login", "Successful login", ipAddress, userAgent);

            await _realtimeService.NotifyUserPresenceAsync(user.UserId, "online");
            await _realtimeService.NotifyAdminDashboardUpdateAsync(new { type = "user_login", userId = user.UserId, fullName = user.FullName, timestamp = DateTime.Now });

            return Ok(new AuthResponseDto
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                RefreshToken = refreshToken.Token
            });
        }

        // POST /api/Auth/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            var email = dto.Email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return Ok(new { message = "If the email exists, a password reset link has been sent." });
            }

            var existingTokens = await _context.VerificationTokens
                .Where(t => t.UserId == user.UserId && t.Type == "PasswordReset" && !t.Used)
                .ToListAsync();
            foreach (var t in existingTokens)
            {
                t.Used = true;
                t.UsedAt = DateTime.Now;
            }

            var token = GenerateSecureToken();
            var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5173";
            var resetLink = $"{baseUrl}/reset-password?token={token}";

            var verificationToken = new VerificationToken
            {
                UserId = user.UserId,
                Token = token,
                Type = "PasswordReset",
                CreatedAt = DateTime.Now,
                ExpiresAt = DateTime.Now.AddMinutes(10),
                MaxAttempts = 3
            };

            _context.VerificationTokens.Add(verificationToken);
            await _context.SaveChangesAsync();

            var emailBody = _emailTemplateService.BuildPasswordResetEmail(user.FullName, resetLink);
            await _emailService.SendEmailAsync(user.UserId, user.Email, "Reset Your Password - Smart Home Automation", emailBody, "PasswordReset");

            await _securityEventService.LogEventAsync(user.UserId, "PasswordResetRequested", "Password reset email sent", GetIpAddress(), GetUserAgent());

            return Ok(new { message = "If the email exists, a password reset link has been sent." });
        }

        // POST /api/Auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Token and password are required." });
            }

            if (dto.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters." });
            }

            var verificationToken = await _context.VerificationTokens
                .FirstOrDefaultAsync(t => t.Token == dto.Token && t.Type == "PasswordReset" && !t.Used);

            if (verificationToken == null)
            {
                return BadRequest(new { message = "Invalid or expired reset token." });
            }

            if (verificationToken.ExpiresAt < DateTime.Now)
            {
                verificationToken.Used = true;
                verificationToken.UsedAt = DateTime.Now;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Reset token has expired. Please request a new one." });
            }

            verificationToken.Used = true;
            verificationToken.UsedAt = DateTime.Now;

            var user = await _context.Users.FindAsync(verificationToken.UserId);
            if (user == null)
            {
                return BadRequest(new { message = "User not found." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var refreshTokens = await _context.RefreshTokens
                .Where(t => t.UserId == user.UserId && !t.RevokedAt.HasValue)
                .ToListAsync();
            foreach (var rt in refreshTokens)
            {
                rt.RevokedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            var ipAddress = GetIpAddress();
            var userAgent = GetUserAgent();
            var (browser, device) = ParseUserAgent(userAgent);

            var changeEmailBody = _emailTemplateService.BuildPasswordChangedEmail(
                user.FullName, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                ipAddress, browser, device);
            await _emailService.SendEmailAsync(user.UserId, user.Email,
                "Password Changed Successfully - Smart Home Automation", changeEmailBody, "PasswordReset");

            await _securityEventService.LogEventAsync(user.UserId, "PasswordReset",
                "Password reset completed successfully", ipAddress, userAgent);
            await _securityEventService.LogActivityAsync(user.UserId, "Password Reset", "User reset their password");

            return Ok(new { message = "Password has been reset successfully." });
        }

        // POST /api/Auth/change-password
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest(new { message = "Current password and new password are required." });
            }

            if (dto.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "New password must be at least 6 characters." });
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            var refreshTokens = await _context.RefreshTokens
                .Where(t => t.UserId == user.UserId && !t.RevokedAt.HasValue)
                .ToListAsync();
            foreach (var rt in refreshTokens)
            {
                rt.RevokedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            var ipAddress = GetIpAddress();
            var userAgent = GetUserAgent();
            var (browser, device) = ParseUserAgent(userAgent);

            var emailBody = _emailTemplateService.BuildPasswordChangedEmail(
                user.FullName, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                ipAddress, browser, device);
            await _emailService.SendEmailAsync(user.UserId, user.Email,
                "Password Changed Successfully - Smart Home Automation", emailBody, "PasswordChanged");

            await _securityEventService.LogEventAsync(user.UserId, "PasswordChanged",
                "Password changed from profile settings", ipAddress, userAgent);
            await _securityEventService.LogActivityAsync(user.UserId, "Password Changed", "User changed their password");

            return Ok(new { message = "Password changed successfully. All other sessions have been logged out." });
        }

        // POST /api/Auth/change-email
        [Authorize]
        [HttpPost("change-email")]
        public async Task<IActionResult> ChangeEmail(ChangeEmailDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var newEmail = dto.NewEmail.Trim().ToLower();

            if (newEmail == user.Email)
            {
                return BadRequest(new { message = "New email is the same as current email." });
            }

            if (await _context.Users.AnyAsync(u => u.Email == newEmail && u.UserId != userId))
            {
                return BadRequest(new { message = "Email is already in use." });
            }

            var oldEmail = user.Email;

            var token = GenerateSecureToken();
            var otp = GenerateOtp();
            var baseUrl = _configuration["App:BaseUrl"] ?? "http://localhost:5173";
            var verificationLink = $"{baseUrl}/verify-email?token={token}&type=emailChange";

            var verificationToken = new VerificationToken
            {
                UserId = user.UserId,
                Token = token,
                Otp = otp,
                Type = "EmailChange",
                CreatedAt = DateTime.Now,
                ExpiresAt = DateTime.Now.AddMinutes(10),
                MaxAttempts = 5
            };

            _context.VerificationTokens.Add(verificationToken);
            await _context.SaveChangesAsync();

            var newEmailBody = _emailTemplateService.BuildBaseLayout("Verify Your New Email",
                _emailTemplateService.TextBlock($"Hello {user.FullName},") +
                _emailTemplateService.TextBlock("Please verify your new email address to complete the change.") +
                _emailTemplateService.PrimaryButton("Verify New Email", verificationLink) +
                _emailTemplateService.OtpCard(otp));
            await _emailService.SendEmailAsync(user.UserId, newEmail,
                "Verify Your New Email - Smart Home Automation", newEmailBody, "EmailChange");

            var oldEmailBody = _emailTemplateService.BuildEmailChangeNotificationEmail(user.FullName, newEmail);
            await _emailService.SendEmailAsync(user.UserId, oldEmail,
                "Email Change Requested - Smart Home Automation", oldEmailBody, "EmailChangeNotification");

            await _securityEventService.LogEventAsync(user.UserId, "EmailChangeRequested",
                $"Email change requested from {oldEmail} to {newEmail}", GetIpAddress(), GetUserAgent());

            return Ok(new { message = "Verification email sent to your new address. Please verify to complete the change.", token });
        }

        // POST /api/Auth/verify-email-change
        [Authorize]
        [HttpPost("verify-email-change")]
        public async Task<IActionResult> VerifyEmailChange(VerifyEmailDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            if (string.IsNullOrWhiteSpace(dto.Token) && string.IsNullOrWhiteSpace(dto.Otp))
            {
                return BadRequest(new { message = "Token or OTP is required." });
            }

            VerificationToken? verificationToken = null;

            if (!string.IsNullOrWhiteSpace(dto.Token))
            {
                verificationToken = await _context.VerificationTokens
                    .FirstOrDefaultAsync(t => t.Token == dto.Token && t.Type == "EmailChange" && !t.Used && t.UserId == userId);
            }
            else if (!string.IsNullOrWhiteSpace(dto.Otp))
            {
                verificationToken = await _context.VerificationTokens
                    .FirstOrDefaultAsync(t => t.Otp == dto.Otp && t.Type == "EmailChange" && !t.Used && t.UserId == userId);
            }

            if (verificationToken == null)
            {
                return BadRequest(new { message = "Invalid or expired verification token." });
            }

            if (verificationToken.ExpiresAt < DateTime.Now)
            {
                verificationToken.Used = true;
                verificationToken.UsedAt = DateTime.Now;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Verification token has expired." });
            }

            verificationToken.Used = true;
            verificationToken.UsedAt = DateTime.Now;

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return BadRequest(new { message = "User not found." });
            }

            var oldEmail = user.Email;
            user.PendingEmail = null;

            var emailBody = _emailTemplateService.BuildEmailChangedConfirmationEmail(user.FullName, oldEmail, user.Email);
            await _emailService.SendEmailAsync(user.UserId, user.Email,
                "Email Address Updated - Smart Home Automation", emailBody, "EmailChanged");

            await _context.SaveChangesAsync();

            await _securityEventService.LogEventAsync(user.UserId, "EmailChanged",
                $"Email changed from {oldEmail} to {user.Email}", GetIpAddress(), GetUserAgent());
            await _securityEventService.LogActivityAsync(user.UserId, "Email Changed", "User changed their email address");

            return Ok(new { message = "Email address updated successfully." });
        }

        // POST /api/Auth/refresh-token
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken))
            {
                return BadRequest(new { message = "Refresh token is required." });
            }

            var storedToken = await _context.RefreshTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == dto.RefreshToken && !t.RevokedAt.HasValue);

            if (storedToken == null)
            {
                return Unauthorized(new { message = "Invalid refresh token." });
            }

            if (storedToken.IsExpired)
            {
                storedToken.RevokedAt = DateTime.Now;
                await _context.SaveChangesAsync();
                return Unauthorized(new { message = "Refresh token has expired. Please log in again." });
            }

            storedToken.RevokedAt = DateTime.Now;

            var user = storedToken.User!;

            var newJwt = _jwtService.GenerateToken(user);

            var newRefreshToken = new RefreshToken
            {
                UserId = user.UserId,
                Token = GenerateSecureToken(),
                ExpiresAt = DateTime.Now.AddDays(7),
                CreatedAt = DateTime.Now
            };
            _context.RefreshTokens.Add(newRefreshToken);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                token = newJwt,
                refreshToken = newRefreshToken.Token
            });
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var fullName = User.FindFirstValue(ClaimTypes.Name);
            var email = User.FindFirstValue(ClaimTypes.Email);
            var role = User.FindFirstValue(ClaimTypes.Role);

            return Ok(new { userId, fullName, email, role });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (userIdClaim == null) return Unauthorized();

            int userId = int.Parse(userIdClaim);
            var user = await _context.Users.FirstOrDefaultAsync(x => x.UserId == userId);
            if (user == null) return NotFound();

            if (user.CurrentSessionStartedAt != null)
            {
                var sessionTime = DateTime.Now - user.CurrentSessionStartedAt.Value;
                user.TotalUsageMinutes += (int)sessionTime.TotalMinutes;
                user.CurrentSessionStartedAt = null;
            }

            var refreshTokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId && !t.RevokedAt.HasValue)
                .ToListAsync();
            foreach (var rt in refreshTokens)
            {
                rt.RevokedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            await _realtimeService.NotifyUserPresenceAsync(userId, "offline");
            await _realtimeService.NotifyAdminDashboardUpdateAsync(new { type = "user_logout", userId, timestamp = DateTime.Now });

            return Ok(new { message = "Logout successful." });
        }

        // GET /api/Auth/smtp-status
        [AllowAnonymous]
        [HttpGet("smtp-status")]
        public IActionResult SmtpStatus()
        {
            var status = _emailService.GetConfigStatus();
            return Ok(new
            {
                configured = status.Configured,
                host = status.Host,
                port = status.Port,
                username = status.Username,
                senderEmail = status.SenderEmail,
                senderName = status.SenderName,
                missingFields = status.MissingFields,
                hint = status.Configured
                    ? "SMTP is configured. To test delivery, register a new user."
                    : "Set environment variables: Smtp__Host, Smtp__Port, Smtp__Username, Smtp__Password, Smtp__SenderEmail"
            });
        }
    }

    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
