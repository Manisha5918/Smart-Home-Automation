using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EmailService> _logger;
        private readonly SmtpSettings _smtpSettings;

        public EmailService(
            IConfiguration configuration,
            ApplicationDbContext context,
            ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _context = context;
            _logger = logger;
            _smtpSettings = LoadSmtpSettings();
        }

        private SmtpSettings LoadSmtpSettings()
        {
            var host = _configuration["EmailSettings:SmtpServer"] ?? _configuration["Smtp:Host"] ?? "";
            var port = int.TryParse(_configuration["EmailSettings:Port"] ?? _configuration["Smtp:Port"], out var p) ? p : 587;
            var username = _configuration["EmailSettings:Username"] ?? _configuration["Smtp:Username"] ?? "";
            var password = _configuration["EmailSettings:Password"] ?? _configuration["Smtp:Password"] ?? "";
            var senderEmail = _configuration["EmailSettings:From"] ?? _configuration["EmailSettings:Username"] ?? _configuration["Smtp:SenderEmail"] ?? "";
            var senderName = _configuration["Smtp:SenderName"] ?? "Smart Home Automation";

            return new SmtpSettings
            {
                Host = host,
                Port = port,
                Username = username,
                Password = password,
                SenderEmail = senderEmail,
                SenderName = senderName,
                EnableSsl = host.Contains("gmail") || host.Contains("sendgrid") || bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) && ssl
            };
        }

        public SmtpConfigStatus GetConfigStatus()
        {
            var missing = new List<string>();
            if (string.IsNullOrWhiteSpace(_smtpSettings.Host)) missing.Add("Smtp:Host");
            if (string.IsNullOrWhiteSpace(_smtpSettings.SenderEmail)) missing.Add("Smtp:SenderEmail");

            return new SmtpConfigStatus
            {
                Configured = missing.Count == 0,
                MissingFields = missing,
                Host = _smtpSettings.Host,
                Port = _smtpSettings.Port,
                Username = string.IsNullOrWhiteSpace(_smtpSettings.Username)
                    ? "(anonymous)"
                    : _smtpSettings.Username[..Math.Min(4, _smtpSettings.Username.Length)] + "***",
                SenderEmail = _smtpSettings.SenderEmail,
                SenderName = _smtpSettings.SenderName,
                EnableSsl = _smtpSettings.EnableSsl
            };
        }

        public async Task<bool> SendEmailAsync(
            int? userId,
            string recipient,
            string subject,
            string body,
            string type)
        {
            if (string.IsNullOrWhiteSpace(_smtpSettings.Host) ||
                string.IsNullOrWhiteSpace(_smtpSettings.SenderEmail))
            {
                var missing = new List<string>();
                if (string.IsNullOrWhiteSpace(_smtpSettings.Host)) missing.Add("Smtp:Host");
                if (string.IsNullOrWhiteSpace(_smtpSettings.SenderEmail)) missing.Add("Smtp:SenderEmail");

                var errorMsg = $"SMTP not configured. Missing: {string.Join(", ", missing)}.";
                _logger.LogError("{ErrorMsg} Email NOT sent to {Recipient}", errorMsg, recipient);
                await LogEmailAttempt(userId, recipient, subject, type, false, errorMsg);
                return false;
            }

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_smtpSettings.SenderName, _smtpSettings.SenderEmail));
                message.To.Add(MailboxAddress.Parse(recipient));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder { HtmlBody = body };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

                if (!_smtpSettings.EnableSsl)
                {
                    await client.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, SecureSocketOptions.StartTlsWhenAvailable);
                }
                else
                {
                    await client.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, SecureSocketOptions.Auto);
                }

                if (!string.IsNullOrWhiteSpace(_smtpSettings.Username) &&
                    !string.IsNullOrWhiteSpace(_smtpSettings.Password))
                {
                    await client.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                await LogEmailAttempt(userId, recipient, subject, type, true, null);
                _logger.LogInformation("Email sent successfully to {Recipient} type={Type}", recipient, type);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Recipient} type={Type}", recipient, type);
                await LogEmailAttempt(userId, recipient, subject, type, false, ex.Message);
                return false;
            }
        }

        private async Task LogEmailAttempt(int? userId, string recipient, string subject, string type, bool success, string? errorMessage)
        {
            try
            {
                _context.EmailLogs.Add(new EmailLog
                {
                    UserId = userId,
                    Recipient = recipient,
                    Subject = subject,
                    Type = type,
                    Success = success,
                    ErrorMessage = errorMessage,
                    SentAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist email log for {Recipient}", recipient);
            }
        }
    }

    public class SmtpSettings
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = "Smart Home Automation";
        public bool EnableSsl { get; set; } = true;
    }

    public class SmtpConfigStatus
    {
        public bool Configured { get; set; }
        public List<string> MissingFields { get; set; } = new();
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public string Username { get; set; } = string.Empty;
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public bool EnableSsl { get; set; }
    }
}
